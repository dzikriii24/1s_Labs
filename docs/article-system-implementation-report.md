# Laporan Implementasi: WordPress Gutenberg-Inspired Article Editor & SEO Intelligence (1sLabs)

## 1. Ringkasan Eksekutif

Seluruh pengalaman menulis dan mengedit artikel di 1sLabs (`ArticleEditorView.tsx`) telah didesain ulang dari halaman formulir admin biasa menjadi **studio editor berbasis blok bergaya WordPress Gutenberg**, lengkap dengan penulisan bebas-gangguan di area tengah, toolbar kontekstual + *floating bubble toolbar*, inspektur pengaturan terstruktur di panel kanan (`Post`, `SEO`, `Advanced`), asisten AI Gemini untuk perbaikan teks terseleksi maupun artikel penuh, serta pratinjau publik Desktop/Mobile yang identik dengan halaman `/blog/:slug`.

Seluruh perubahan tetap kompatibel penuh dengan data HTML `blog_articles.content`, mesin analisis `seoAnalyzer.service.js`, layanan AI `blogAi.service.js`, serta arsitektur backend Express/MySQL 1sLabs.

---

## 2. Arsitektur & Komponen Frontend yang Dibuat / Diperbarui

### A. Orkestrator Utama Editor
- [`ArticleEditorView.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/ArticleEditorView.tsx)
  - Workspace studio *full-viewport* (`fixed inset-0 z-40`) dengan pelindung perubahan belum tersimpan (`beforeunload` dan konfirmasi keluar via SweetAlert2).
  - Sinkronisasi dua arah antara TipTap v2 HTML document, state formulir, mode HTML Source, dan pembaruan eksternal (`OneClickOptimizeModal` serta *Revert Revision*).
  - **Debounced Autosave (~3,5 detik)** dengan monotonic `saveRequestSeqRef` + `AbortController` agar request lama tidak pernah menimpa editan terbaru.
  - Untuk artikel yang sudah `published`, autosave menyimpan *backup* lokal terlebih dahulu agar halaman publik tidak berubah setengah jadi sebelum pengguna menekan **Perbarui**.
  - Pintasan keyboard standar: `Ctrl/Cmd + S` untuk simpan dan `Ctrl/Cmd + K` untuk modal sisipkan/edit link (dilengkapi pintasan link internal `/hosting`, `/docs`, `/schedule`, `/blog`, dan daftar artikel terpublikasi).

### B. Modul Editor di `src/components/admin/views/content/editor/`
1. [`editorTypes.ts`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/editorTypes.ts)
   - Tipe terpusat `EditorFormState`, `AutosaveStatus`, `SidebarInspectorTab`, `SelectionRangeText`, `SelectedAiPreview`, dan utilitas `quickSlugify`.
2. [`tiptapExtensions.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/tiptapExtensions.tsx)
   - Ekstensi node kustom React NodeView berbasis `@tiptap/core` & `@tiptap/react`:
     - `FigureImageExtension` (alignment kiri/tengah/kanan, lebar 100%/75%/50%, ganti media, edit alt/caption, generator **AI Alt Text**).
     - `CalloutExtension` (nada `Info`, `Tips`, `Perhatian` dengan `<NodeViewContent>` yang dapat langsung diketik).
     - `CtaButtonExtension` (judul, deskripsi, label tombol, URL, gaya primary/outline).
     - `EmbedExtension` (validasi aman ke YouTube/Vimeo/Loom embed URL via `toSafeEmbedUrl`).
     - `GalleryExtension` (grid multi-foto 2 atau 3 kolom + tambah gambar via Media Library).
     - `CustomHtmlExtension` + helper client-side `sanitizeClientHtml()` (mode kode & pratinjau aman tanpa `<script>` atau event handler).
   - `EditorMediaBridgeContext` sebagai jembatan antara React NodeView dan `MediaLibraryModal`.
3. [`blockDefinitions.ts`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/blockDefinitions.ts)
   - Katalog block bersama untuk `+` Block Inserter dan `/` Slash Command (`basic`, `media`, `advanced`, `ai`).
4. [`ArticleEditorToolbar.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleEditorToolbar.tsx)
   - Sticky top toolbar bergaya WordPress: `← Artikel`, tombol `+` Inserter, Undo/Redo, popover Document Outline (Heading + jumlah kata & estimasi waktu baca), status artikel, indikator `Saving...` / `Saved` / `Save Failed`, toggle `AI Writer`, `Pratinjau`, `Simpan`, `Terbitkan`/`Perbarui`, toggle Sidebar Inspector, dan menu `MoreVertical` (HTML Source, Copy HTML, Riwayat Revisi).
5. [`ArticleFormattingToolbar.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleFormattingToolbar.tsx)
   - *Floating BubbleMenu* otomatis saat teks dipilih + strip pemformatan kontekstual (Tipe Block H2/H3/H4/Kutipan, Bold/Italic/Underline/Strikethrough, List, Link, Alignment, aksi tabel add/delete row & column, serta menu `AI Perbaiki` untuk teks terpilih).
6. [`ArticleBlockEditor.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleBlockEditor.tsx)
   - Kanvas kertas terpusat (`max-w-[760px]`): Title auto-resize dominan, Excerpt/Subtitle, Hero Featured Image card (Media Library, quick upload, Alt + AI Alt, Caption), TipTap `EditorContent`.
   - Gutter kiri per-block: tombol `+` sisipkan setelah block, pegangan drag-and-drop 6-titik (`GripVertical`) dengan garis indikator posisi target, menu aksi block (Naik, Turun, Duplikat, Konversi tipe block, `Perbaiki dengan AI`, Hapus), dan palet perintah `/` (*Slash Command*) dengan navigasi keyboard `ArrowUp`/`ArrowDown`/`Enter`/`Escape`.
7. [`ArticleSettingsSidebar.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleSettingsSidebar.tsx)
   - Panel kanan *collapsible* di desktop (`>= lg`) dan drawer *slide-over* di layar kecil, terbagi dalam 3 tab:
     - **Post**: Status editorial, Visibilitas (`Publik`, `Unlisted`, `Privat`), Tanggal/Jadwal publikasi, Prioritas & Deadline, Penulis, Kategori, Topic Cluster, Tags autocomplete, toggle Artikel Unggulan & Pillar Content, Permalink Slug (Lock/Unlock + Copy URL), Gambar Utama + Alt/Caption, Excerpt, Catatan Editorial, dan tautan Revisi.
     - **SEO**: Merender `ArticleSEOPanel`.
     - **Advanced**: Canonical URL, Robots Meta Directive, Schema.org Type (`BlogPosting`, `Article`, `TechArticle`, `HowTo`), Open Graph Title/Description/Image, serta tombol Riwayat Revisi.
8. [`ArticleSEOPanel.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleSEOPanel.tsx)
   - 3 meter skor live (`SEO`, `Readability`, `GEO Ready`), deteksi Search Intent, CTA **1-Klik Optimasi SEO + GEO (AI)**, Focus & Secondary Keyphrases dengan riset AI, progress bar SEO Title & Meta Description, Pratinjau Google SERP (Desktop vs Mobile), Checklist filterable (`Semua`, `SEO`, `Keterbacaan`, `GEO AI`) dengan tombol perbaikan AI langsung, dan FAQ Schema GEO Builder.
9. [`ArticleAIAssistant.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticleAIAssistant.tsx)
   - Panel asisten AI ringkas dengan dua mode:
     - **Edit Teks Terpilih Saja**: Menampilkan pembanding **Asli vs Versi Disempurnakan AI** beserta penjelasan dan tombol `Terapkan ke Pilihan` (hanya mengganti rentang `{ from, to }` yang diblokir) atau `Buang`.
     - **Co-Writer & Audit Artikel Penuh**: Generator Intro, Penutup/CTA (`conclusion`), Outline H2/H3, FAQ GEO, 5 Ide Judul SEO, Meta Description, Saran Internal Link, Riset Keyphrase, Audit Mendalam, dan 1-Klik Optimasi.
10. [`ArticlePreviewModal.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/editor/ArticlePreviewModal.tsx)
    - Pratinjau publik langsung dari state editor sebelum disimpan, dengan *viewport switcher* **Desktop vs Mobile (390px)**, struktur `.oneslabs-blog-prose`, Daftar Isi (TOC) live, FAQ accordion, Caption Featured Image, serta kartu konsultasi 1sLabs.

### C. File Frontend Pendukung yang Diperbarui
- [`package.json`](file:///c:/Users/dzikri/Downloads/1sLabs-website/package.json): Penambahan dependensi TipTap v2 (`@tiptap/core@2`, `@tiptap/pm@2`, `@tiptap/react@2`, `@tiptap/starter-kit@2`, `@tiptap/extension-underline@2`, `@tiptap/extension-text-align@2`, `@tiptap/extension-link@2`, `@tiptap/extension-placeholder@2`, `@tiptap/extension-table@2`, `@tiptap/extension-table-row@2`, `@tiptap/extension-table-header@2`, `@tiptap/extension-table-cell@2`).
- [`MediaLibraryModal.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/components/admin/views/content/MediaLibraryModal.tsx): Penambahan prop opsional `onSelectStructuredImage` untuk menyisipkan/mengganti block `figureImage` dan menambah foto ke `galleryBlock`.
- [`BlogDetailPage.tsx`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/pages/BlogDetailPage.tsx): Menampilkan `<figcaption>` untuk `featured_image_caption` dan memaksakan `noindex, nofollow` saat `visibility === 'unlisted'`.
- [`blogApi.ts`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/services/blogApi.ts): Penambahan tipe `ArticleVisibility`, field `visibility` dan `featured_image_caption` pada `BlogArticle`, serta dukungan `AbortSignal` pada `createPost` dan `updatePost`.
- [`index.css`](file:///c:/Users/dzikri/Downloads/1sLabs-website/src/index.css): Styling untuk elemen editor & artikel publik (`h4`, `hr`, inline `code`, `figure`/`figcaption`, `.callout-box`, `.oneslabs-gallery`, `.oneslabs-embed`, `.oneslabs-cta-block`, serta placeholder & seleksi tabel `.ProseMirror`).

---

## 3. Perubahan Backend & Skema Database

### A. Migrasi Skema MySQL Non-Destruktif
Ditangani otomatis & idempoten pada [`blogSchema.service.js`](file:///c:/Users/dzikri/Downloads/1sLabs-website/backend/src/services/blog/blogSchema.service.js) via `SHOW COLUMNS FROM blog_articles`:
- `visibility`: `ENUM('public', 'unlisted', 'private') DEFAULT 'public'`
- `featured_image_caption`: `VARCHAR(500) NULL`

### B. Sanitasi HTML, Visibilitas & Autosave API
- [`blogSchema.service.js`](file:///c:/Users/dzikri/Downloads/1sLabs-website/backend/src/services/blog/blogSchema.service.js): `sanitizeArticleHtml()` kini mempertahankan `<iframe>` embed terpercaya (`youtube.com/embed/`, `youtube-nocookie.com/embed/`, `player.vimeo.com/video/`, `loom.com/embed/`) di dalam `.oneslabs-embed` sambil tetap menghapus `<script>`, handler `on*`, dan tag berbahaya.
- [`blog.routes.js`](file:///c:/Users/dzikri/Downloads/1sLabs-website/backend/src/routes/blog.routes.js):
  - Menyimpan `visibility` & `featured_image_caption` pada endpoint create/update artikel.
  - Menyaring daftar publik `/api/blog/posts` agar hanya menampilkan `visibility = 'public'` dan memblokir artikel `private` (`404`) jika diakses tanpa mode pratinjau terautentikasi.
  - Mendukung flag `is_autosave: true` dengan *throttling* pembuatan snapshot revisi (maksimal 1 snapshot autosave setiap 3 menit tanpa membanjiri activity log).
- [`seoIntelligence.routes.js`](file:///c:/Users/dzikri/Downloads/1sLabs-website/backend/src/routes/seoIntelligence.routes.js): Mengecualikan artikel `unlisted` & `private` dari `/sitemap.xml` dan listing crawler SSR `/blog`, serta mengeluarkan `noindex, nofollow` pada crawler SSR untuk artikel `unlisted`.

### C. Aksi AI Gemini Baru
Diperluas di [`blogAi.service.js`](file:///c:/Users/dzikri/Downloads/1sLabs-website/backend/src/services/blog/blogAi.service.js) (disanitasi sebelum dikembalikan):
- `conclusion`: Pembuat paragraf penutup + ajakan bertindak (*CTA*) faktual 1sLabs.
- Aksi khusus teks terseleksi: `improve_selection`, `rewrite_selection`, `expand_selection`, `summarize_selection`, `fix_grammar`, `improve_readability_selection`, `generate_heading_selection`.

---

## 4. Hasil Verifikasi & Pengujian Teramati

Seluruh verifikasi dijalankan setelah edit kode terakhir dan deployment ke server produksi (`103.119.237.132`):

1. **TypeScript App Check (`npx tsc -p tsconfig.app.json --noEmit`)**:
   - **0 error** pada `ArticleEditorView.tsx` dan seluruh modul baru di `src/components/admin/views/content/editor/`.
2. **ESLint (`npx eslint src/components/admin/views/content/ArticleEditorView.tsx src/components/admin/views/content/editor`)**:
   - **Exit code 0** (`0 errors`, 2 warning `react-refresh/only-export-components` non-blocking pada helper export di `tiptapExtensions.tsx`).
3. **Vite Production Build (`npm run build`)**:
   - **Exit code 0** (`✓ 2202 modules transformed`, selesai dalam `10.74s`, aset baru `index-jQiyks9Z.js`, `index-dlz9SnuN.css`, `AdminDashboardPage-Bt1DFOWp.js` terhasilkan).
4. **Deployment Produksi (`python deploy/deploy_production_103.py`)**:
   - **Exit code 0**, frontend `dist/` dan backend terunggah ke server, serta CloudLinux Passenger berhasil direstart (`{"result": "success"}`).
5. **Verifikasi Live HTTP, Database & AI (Produksi `https://1slabs.my.id`)**:
   - `GET https://1slabs.my.id/` → HTTP `200`
   - `GET https://1slabs.my.id/api/health` → HTTP `200` (`"status":"healthy","database":"connected"`)
   - Googlebot `GET https://1slabs.my.id/blog` → HTTP `200`, `GET https://1slabs.my.id/blog/non-existent-verify-slug` → HTTP `404`
   - `SHOW COLUMNS FROM blog_articles` → Kolom `visibility` (`enum('public','unlisted','private')`, default `'public'`) dan `featured_image_caption` (`varchar(500)`) terkonfirmasi ada di MySQL produksi.
   - Uji `sanitizeArticleHtml()` → Membuang `<script>` & `<iframe>` asing, serta mempertahankan embed `youtube.com/embed/...`.
   - Uji visibilitas sementara (data uji otomatis dihapus di blok `finally`): `/api/blog/posts` & `/sitemap.xml` mengecualikan `unlisted` & `private`, artikel `private` mengembalikan `404`, artikel `unlisted` mengembalikan HTTP `200` dengan meta `noindex, nofollow` pada crawler SSR.
   - Uji Gemini AI live (`runAiAssist` pada model `gemini-2.5-flash`): task `improve_selection` sukses (`latencyMs: 10130`, menyertakan `improved_html` & `explanation`) dan task `conclusion` sukses (`latencyMs: 6396`, menyertakan `conclusion_html`).

