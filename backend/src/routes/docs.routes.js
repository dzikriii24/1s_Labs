const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireAdminOrMarketing } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// Helper to generate URL slug
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to auto-extract Table of Contents from Markdown headings
function extractTOC(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const toc = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      const title = trimmed.replace('### ', '').trim();
      const id = slugify(title);
      if (id && title) {
        toc.push({ id, title });
      }
    } else if (trimmed.startsWith('## ')) {
      const title = trimmed.replace('## ', '').trim();
      const id = slugify(title);
      if (id && title) {
        toc.push({ id, title });
      }
    }
  }
  return toc;
}

// Category metadata defaults
const CATEGORY_META = {
  'getting-started': { title: '1. Getting Started', icon: 'Sparkles', desc: 'Panduan awal mengenal platform, pendaftaran akun, dan navigasi portal 1sLabs.' },
  'free-plan': { title: '2. Free Plan Program', icon: 'Gift', desc: 'Panduan lengkap klaim hosting gratis, kuota penggunaan, aturan renewal, dan masa aktif.' },
  'cloud-hosting': { title: '3. Cloud Hosting & Server', icon: 'Server', desc: 'Spesifikasi server, cPanel, CloudLinux, alokasi resource, dan infrastruktur NVMe.' },
  'nodejs-frameworks': { title: '4. Node.js & Frameworks', icon: 'Cpu', desc: 'Tutorial deploy aplikasi Express, React, Vite, Next.js, dan konfigurasi CloudLinux Node.js Selector.' },
  'domains-dns': { title: '5. Custom Domain & DNS', icon: 'Globe', desc: 'Petunjuk setup domain sendiri, custom nameserver, registrasi CNAME, A-Record, dan propagasi DNS.' },
  'databases': { title: '6. Database MySQL & MariaDB', icon: 'Database', desc: 'Manajemen basis data melalui cPanel phpMyAdmin, koneksi pool Node.js, dan backup berkala.' },
  'security-ssl': { title: '7. Keamanan, SSL & CageFS', icon: 'Shield', desc: 'Aktivasi AutoSSL gratis, isolasi keamanan CageFS, proteksi DDoS, dan best practice sanitasi kode.' },
  'billing-orders': { title: '8. Billing, Invoice & Pembayaran', icon: 'Receipt', desc: 'Metode pembayaran transfer bank, upload bukti transfer, konfirmasi otomatis, dan faktur pajak.' },
  'maintenance-services': { title: '9. Pemeliharaan & Custom Dev', icon: 'Wrench', desc: 'Layanan Annual Maintenance, bug fixing, audit performa website, dan jasa custom software 1sLabs.' },
  'troubleshooting': { title: '10. FAQ & Troubleshooting', icon: 'BookOpen', desc: 'Penyelesaian error umum: DNS not resolved, error 500/503 Passenger, batas memory limit, dan CORS.' }
};

/**
 * GET /api/docs
 * Public endpoint: Return all published documentation grouped into categories
 */
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, slug, title, category, category_title, description, reading_time, keywords, toc_json, content, status, is_custom, view_count, updated_at
       FROM documentation_articles
       WHERE status = 'published'
       ORDER BY id ASC`
    );

    // Group by category
    const categoryMap = new Map();

    for (const row of rows) {
      let keywords = [];
      if (typeof row.keywords === 'string') {
        keywords = row.keywords.split(',').map(k => k.trim()).filter(Boolean);
      } else if (Array.isArray(row.keywords)) {
        keywords = row.keywords;
      }

      let toc = [];
      if (row.toc_json) {
        try {
          toc = typeof row.toc_json === 'string' ? JSON.parse(row.toc_json) : row.toc_json;
        } catch {
          toc = extractTOC(row.content);
        }
      } else {
        toc = extractTOC(row.content);
      }

      const article = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        categoryTitle: row.category_title,
        description: row.description,
        readingTime: row.reading_time || '3 menit',
        keywords,
        toc,
        content: row.content,
        lastUpdated: new Date(row.updated_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        isCustom: Boolean(row.is_custom),
        viewCount: row.view_count || 0
      };

      if (!categoryMap.has(row.category)) {
        const meta = CATEGORY_META[row.category] || {
          title: row.category_title || row.category,
          icon: 'BookOpen',
          desc: 'Dokumentasi dan panduan teknis 1sLabs.'
        };
        categoryMap.set(row.category, {
          id: row.category,
          title: meta.title,
          description: meta.desc,
          iconName: meta.icon,
          articles: []
        });
      }

      categoryMap.get(row.category).articles.push(article);
    }

    const categories = Array.from(categoryMap.values());
    const allArticles = rows.map(r => ({
      slug: r.slug,
      title: r.title,
      category: r.category,
      categoryTitle: r.category_title,
      description: r.description
    }));

    return res.json({
      success: true,
      categories,
      totalArticles: rows.length,
      articles: allArticles
    });
  } catch (err) {
    console.error('[GET /api/docs Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dokumentasi: ' + err.message
    });
  }
});

/**
 * GET /api/docs/admin/all
 * Admin endpoint: Return all documentation articles with management metadata
 */
router.get('/admin/all', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, slug, title, category, category_title, description, reading_time, keywords, status, is_custom, view_count, created_at, updated_at
       FROM documentation_articles
       ORDER BY updated_at DESC, id DESC`
    );

    return res.json({
      success: true,
      articles: rows
    });
  } catch (err) {
    console.error('[GET /api/docs/admin/all Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar dokumen: ' + err.message
    });
  }
});

/**
 * GET /api/docs/:slug
 * Public endpoint: Return single article by slug and increment view count
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await query(
      `SELECT id, slug, title, category, category_title, description, reading_time, keywords, toc_json, content, status, is_custom, view_count, updated_at
       FROM documentation_articles
       WHERE slug = ? LIMIT 1`,
      [slug]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artikel dokumentasi tidak ditemukan.'
      });
    }

    const row = rows[0];

    // Fire and forget view increment
    query(`UPDATE documentation_articles SET view_count = view_count + 1 WHERE id = ?`, [row.id]).catch(() => {});

    let keywords = [];
    if (typeof row.keywords === 'string') {
      keywords = row.keywords.split(',').map(k => k.trim()).filter(Boolean);
    } else if (Array.isArray(row.keywords)) {
      keywords = row.keywords;
    }

    let toc = [];
    if (row.toc_json) {
      try {
        toc = typeof row.toc_json === 'string' ? JSON.parse(row.toc_json) : row.toc_json;
      } catch {
        toc = extractTOC(row.content);
      }
    } else {
      toc = extractTOC(row.content);
    }

    const article = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      categoryTitle: row.category_title,
      description: row.description,
      readingTime: row.reading_time || '3 menit',
      keywords,
      toc,
      content: row.content,
      lastUpdated: new Date(row.updated_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      isCustom: Boolean(row.is_custom),
      viewCount: (row.view_count || 0) + 1
    };

    return res.json({
      success: true,
      article
    });
  } catch (err) {
    console.error('[GET /api/docs/:slug Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil artikel dokumentasi: ' + err.message
    });
  }
});

/**
 * POST /api/docs
 * Admin endpoint: Create a new documentation article
 */
router.post('/', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      category,
      categoryTitle,
      description,
      readingTime,
      keywords,
      content,
      status = 'published'
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Judul, kategori, dan isi artikel dokumentasi wajib diisi.'
      });
    }

    const finalSlug = slugify(customSlug || title);
    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: 'Slug URL tidak valid.'
      });
    }

    // Check slug uniqueness
    const existing = await query('SELECT id FROM documentation_articles WHERE slug = ? LIMIT 1', [finalSlug]);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Slug "${finalSlug}" sudah digunakan oleh artikel lain. Silakan ubah judul atau slug.`
      });
    }

    // Determine category title
    const resolvedCatTitle =
      categoryTitle ||
      (CATEGORY_META[category] ? CATEGORY_META[category].title : category);

    // Auto calculate reading time if not provided
    const wordCount = content.trim().split(/\s+/).length;
    const resolvedReadingTime = readingTime || `${Math.max(1, Math.ceil(wordCount / 180))} menit`;

    // Format keywords string
    const keywordsStr = Array.isArray(keywords)
      ? keywords.join(', ')
      : (keywords || '').trim();

    // Auto generate TOC
    const toc = extractTOC(content);
    const tocJson = JSON.stringify(toc);

    const insertResult = await query(
      `INSERT INTO documentation_articles
        (slug, title, category, category_title, description, reading_time, keywords, toc_json, content, status, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        finalSlug,
        title.trim(),
        category.trim(),
        resolvedCatTitle.trim(),
        (description || '').trim(),
        resolvedReadingTime,
        keywordsStr,
        tocJson,
        content,
        status === 'draft' ? 'draft' : 'published'
      ]
    );

    await logActivity({
      userId: req.user.id,
      action: 'CREATE_DOCUMENTATION',
      details: `Dokumentasi baru dibuat: "${title}" (slug: ${finalSlug})`,
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Artikel dokumentasi berhasil dibuat!',
      articleId: insertResult.insertId,
      slug: finalSlug
    });
  } catch (err) {
    console.error('[POST /api/docs Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat dokumentasi: ' + err.message
    });
  }
});

/**
 * PUT /api/docs/:id
 * Admin endpoint: Update an existing documentation article
 */
router.put('/:id', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: customSlug,
      category,
      categoryTitle,
      description,
      readingTime,
      keywords,
      content,
      status
    } = req.body;

    const existingRows = await query('SELECT * FROM documentation_articles WHERE id = ? LIMIT 1', [id]);
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artikel dokumentasi tidak ditemukan.'
      });
    }

    const current = existingRows[0];
    const finalSlug = customSlug ? slugify(customSlug) : current.slug;

    // Check slug collision with other records
    if (finalSlug !== current.slug) {
      const collision = await query('SELECT id FROM documentation_articles WHERE slug = ? AND id != ? LIMIT 1', [finalSlug, id]);
      if (collision && collision.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Slug "${finalSlug}" sudah dipakai oleh artikel lain.`
        });
      }
    }

    const newContent = content !== undefined ? content : current.content;
    const newToc = extractTOC(newContent);

    const resolvedCat = category || current.category;
    const resolvedCatTitle =
      categoryTitle ||
      (CATEGORY_META[resolvedCat] ? CATEGORY_META[resolvedCat].title : current.category_title);

    const keywordsStr = keywords !== undefined
      ? (Array.isArray(keywords) ? keywords.join(', ') : String(keywords || ''))
      : current.keywords;

    await query(
      `UPDATE documentation_articles SET
        title = ?,
        slug = ?,
        category = ?,
        category_title = ?,
        description = ?,
        reading_time = ?,
        keywords = ?,
        toc_json = ?,
        content = ?,
        status = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : current.title,
        finalSlug,
        resolvedCat.trim(),
        resolvedCatTitle.trim(),
        description !== undefined ? description.trim() : current.description,
        readingTime !== undefined ? readingTime : current.reading_time,
        keywordsStr,
        JSON.stringify(newToc),
        newContent,
        status || current.status,
        id
      ]
    );

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_DOCUMENTATION',
      details: `Dokumentasi diperbarui (ID: ${id}): "${title || current.title}"`,
      ip: req.ip
    });

    return res.json({
      success: true,
      message: 'Artikel dokumentasi berhasil diperbarui!',
      slug: finalSlug
    });
  } catch (err) {
    console.error('[PUT /api/docs/:id Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui dokumentasi: ' + err.message
    });
  }
});

/**
 * DELETE /api/docs/:id
 * Admin endpoint: Delete documentation article
 */
router.delete('/:id', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT title, slug FROM documentation_articles WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artikel dokumentasi tidak ditemukan.'
      });
    }

    const { title, slug } = rows[0];
    await query('DELETE FROM documentation_articles WHERE id = ?', [id]);

    await logActivity({
      userId: req.user.id,
      action: 'DELETE_DOCUMENTATION',
      details: `Dokumentasi dihapus (ID: ${id}): "${title}" (${slug})`,
      ip: req.ip
    });

    return res.json({
      success: true,
      message: `Artikel "${title}" berhasil dihapus.`
    });
  } catch (err) {
    console.error('[DELETE /api/docs/:id Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus dokumentasi: ' + err.message
    });
  }
});

module.exports = router;

