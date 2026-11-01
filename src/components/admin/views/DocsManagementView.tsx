import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Save,
  HelpCircle,
  FileText,
  Tag,
  FolderOpen,
  Code,
  List,
  Heading,
  Bold,
  Italic,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '../../../services/api';
import notify from '../../../lib/notify';

interface DocItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  category_title: string;
  description: string;
  reading_time: string;
  keywords: string;
  content?: string;
  status: 'published' | 'draft';
  is_custom: number | boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  { id: 'getting-started', title: '1. Getting Started' },
  { id: 'free-plan', title: '2. Free Plan Program' },
  { id: 'cloud-hosting', title: '3. Cloud Hosting & Server' },
  { id: 'nodejs-frameworks', title: '4. Node.js & Frameworks' },
  { id: 'domains-dns', title: '5. Custom Domain & DNS' },
  { id: 'databases', title: '6. Database MySQL & MariaDB' },
  { id: 'security-ssl', title: '7. Keamanan, SSL & CageFS' },
  { id: 'billing-orders', title: '8. Billing, Invoice & Pembayaran' },
  { id: 'maintenance-services', title: '9. Pemeliharaan & Custom Dev' },
  { id: 'troubleshooting', title: '10. FAQ & Troubleshooting' }
];

export const DocsManagementView: React.FC = () => {
  const [articles, setArticles] = useState<DocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview'>('editor');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('getting-started');
  const [formCategoryTitle, setFormCategoryTitle] = useState('1. Getting Started');
  const [formDescription, setFormDescription] = useState('');
  const [formReadingTime, setFormReadingTime] = useState('3 menit');
  const [formKeywords, setFormKeywords] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [autoSlug, setAutoSlug] = useState(true);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await api.docs.getAdminAll();
      if (res.success && res.articles) {
        setArticles(res.articles);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat artikel dokumentasi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Slug generator helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (autoSlug && !isEditing) {
      setFormSlug(slugify(val));
    }
  };

  const handleCategorySelect = (catId: string) => {
    setFormCategory(catId);
    const found = DEFAULT_CATEGORIES.find((c) => c.id === catId);
    if (found) {
      setFormCategoryTitle(found.title);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentArticleId(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('getting-started');
    setFormCategoryTitle('1. Getting Started');
    setFormDescription('');
    setFormReadingTime('3 menit');
    setFormKeywords('');
    setFormContent(`### Pengantar\nTuliskan penjelasan pengantar dokumentasi di sini.\n\n### Langkah-Langkah Panduan\n1. Langkah pertama yang harus dilakukan pengguna.\n2. Langkah kedua dengan penjelasan teknis.\n3. Langkah ketiga penyelesaian.\n\n\`\`\`bash\n# Contoh perintah terminal atau konfigurasi\ncd /home/user/public_html\n\`\`\`\n\n### Catatan Penting\n- Pastikan seluruh konfigurasi sudah sesuai sebelum menjalankan aplikasi.`);
    setFormStatus('published');
    setAutoSlug(true);
    setActiveEditorTab('editor');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (art: DocItem) => {
    setIsEditing(true);
    setCurrentArticleId(art.id);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormCategory(art.category);
    setFormCategoryTitle(art.category_title);
    setFormDescription(art.description || '');
    setFormReadingTime(art.reading_time || '3 menit');
    setFormKeywords(art.keywords || '');
    setFormStatus(art.status || 'published');
    setAutoSlug(false);
    setActiveEditorTab('editor');
    setIsModalOpen(true);

    // Fetch full content if not in row
    try {
      const fullRes = await api.docs.getBySlug(art.slug);
      if (fullRes.success && fullRes.article) {
        setFormContent(fullRes.article.content || '');
      }
    } catch {
      setFormContent(art.content || '');
    }
  };

  // Save / Update Doc
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      notify.warning('Judul artikel dan isi konten wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && currentArticleId) {
        const res = await api.docs.update(currentArticleId, {
          title: formTitle.trim(),
          slug: formSlug.trim() || slugify(formTitle),
          category: formCategory,
          categoryTitle: formCategoryTitle,
          description: formDescription.trim(),
          readingTime: formReadingTime.trim(),
          keywords: formKeywords.trim(),
          content: formContent,
          status: formStatus
        });
        if (res.success) {
          notify.success('Artikel dokumentasi berhasil diperbarui!');
          setIsModalOpen(false);
          fetchArticles();
        }
      } else {
        const res = await api.docs.create({
          title: formTitle.trim(),
          slug: formSlug.trim() || slugify(formTitle),
          category: formCategory,
          categoryTitle: formCategoryTitle,
          description: formDescription.trim(),
          readingTime: formReadingTime.trim(),
          keywords: formKeywords.trim(),
          content: formContent,
          status: formStatus
        });
        if (res.success) {
          notify.success('Artikel dokumentasi baru berhasil dibuat!');
          setIsModalOpen(false);
          fetchArticles();
        }
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan dokumentasi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete article
  const handleDelete = async (art: DocItem) => {
    const ok = window.confirm(`Apakah Anda yakin ingin menghapus artikel dokumentasi "${art.title}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!ok) return;

    try {
      const res = await api.docs.delete(art.id);
      if (res.success) {
        notify.success('Artikel berhasil dihapus.');
        setArticles((prev) => prev.filter((a) => a.id !== art.id));
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus artikel.');
    }
  };

  // Insert markdown helpers
  const insertMarkdown = (snippet: string) => {
    setFormContent((prev) => prev + '\n' + snippet);
  };

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchSearch =
        searchQuery === '' ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.description && art.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.keywords && art.keywords.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' || art.category === selectedCategory;

      const matchStatus =
        statusFilter === 'all' || art.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [articles, searchQuery, selectedCategory, statusFilter]);

  // Unique categories in list
  const existingCategories = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_CATEGORIES.forEach((c) => map.set(c.id, c.title));
    articles.forEach((a) => {
      if (a.category && !map.has(a.category)) {
        map.set(a.category, a.category_title || a.category);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [articles]);

  // Stat summary
  const totalPublished = articles.filter((a) => a.status === 'published').length;
  const totalDraft = articles.filter((a) => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Content &amp; Technical Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white font-['Mori',_sans-serif]">
            Pusat Dokumentasi &amp; Panduan 1sLabs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Kelola seluruh artikel teknis, tutorial deployment, panduan cPanel, dan arsitektur hosting. Artikel yang dibuat atau diperbarui akan langsung tampil di portal publik <code className="text-indigo-600 dark:text-indigo-400 font-mono">/docs</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchArticles}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <span>Buka Web /docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Artikel</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
            {articles.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Terbagi dalam {existingCategories.length} kategori topik
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Artikel Publik</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalPublished}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Aktif tampil dan terindeks di mesin pencari
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Draft / Arsip</span>
            <FolderOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {totalDraft}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Belum dipublikasikan ke publik
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Kunjungan</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {totalViews.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Akumulasi pembaca panduan teknis
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul, slug, atau kata kunci..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Kategori ({articles.length})</option>
            {existingCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Artikel / Judul</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Views</th>
                <th className="py-3 px-4">Waktu Baca</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span>Memuat daftar dokumentasi...</span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Tidak ada artikel dokumentasi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white max-w-xs">
                      <div className="truncate">{art.title}</div>
                      <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">
                        {art.description || 'Tidak ada deskripsi singkat.'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 font-medium text-[11px] truncate block max-w-[180px]">
                        {art.category_title || art.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      /docs/{art.slug}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {art.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-600 dark:text-zinc-400">
                      {art.view_count || 0}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {art.reading_time || '3 menit'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`/docs/${art.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                          title="Lihat di Web Publik"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(art)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          title="Edit Artikel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(art)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hapus Artikel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT DOCUMENTATION ARTICLE               */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isSaving && setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {isEditing ? 'Edit Artikel Dokumentasi' : 'Buat Artikel Dokumentasi Baru'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isEditing
                      ? `Memperbarui isi artikel "${formTitle}"`
                      : 'Isi detail artikel panduan teknis yang akan dipublikasikan ke /docs.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Judul Artikel */}
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Judul Artikel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Contoh: Cara Konfigurasi Custom Domain & DNS Cloudflare"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Slug URL */}
                <div className="sm:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Slug URL
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoSlug(!autoSlug);
                        if (!autoSlug) setFormSlug(slugify(formTitle));
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold"
                    >
                      {autoSlug ? 'Kustomisasi' : 'Auto-Generate'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    disabled={autoSlug}
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugify(e.target.value))}
                    placeholder="cara-konfigurasi-domain"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Kategori Dokumentasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Status Publikasi
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="published">Published (Aktif)</option>
                    <option value="draft">Draft (Disembunyikan)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Estimasi Waktu Baca
                  </label>
                  <input
                    type="text"
                    value={formReadingTime}
                    onChange={(e) => setFormReadingTime(e.target.value)}
                    placeholder="3 menit"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Ringkasan / Meta Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan isi artikel untuk ditampilkan di kartu panduan dan hasil pencarian Google..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Kata Kunci */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Kata Kunci / Tag Pencarian (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="custom domain, dns cloudflare, nameserver, cpanel"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Markdown Content Editor with Tabs & Formatting Helpers */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('editor')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeEditorTab === 'editor'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Editor Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeEditorTab === 'preview'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  {/* Toolbar Shortcuts */}
                  {activeEditorTab === 'editor' && (
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### Sub-Judul Baru\n')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
                        title="Tambah Heading"
                      >
                        ### Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('```bash\n# Masukkan perintah di sini\n```\n')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono"
                        title="Tambah Code Block"
                      >
                        Code Block
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. Langkah pertama\n2. Langkah kedua\n')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
                        title="Numbered List"
                      >
                        1. List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- Poin catatan penting\n')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
                        title="Bullet List"
                      >
                        &bull; Bullet
                      </button>
                    </div>
                  )}
                </div>

                {activeEditorTab === 'editor' ? (
                  <textarea
                    rows={14}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Tuliskan isi dokumentasi menggunakan format Markdown..."
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 min-h-[300px] max-h-[420px] overflow-y-auto space-y-3 text-xs leading-relaxed">
                    <div className="font-extrabold text-base text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
                      {formTitle || 'Judul Panduan'}
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                      {formContent}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-zinc-400">
                  Tip: Judul berformat <code className="text-indigo-600 dark:text-indigo-400">### Judul</code> akan secara otomatis dibuatkan daftar isi (Table of Contents / TOC) di bilah navigasi kanan.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Publikasikan Artikel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsManagementView;

