const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth, optionalAuth, requireAdminOrMarketing, isMarketing, isSuperAdmin } = require('../middleware/auth');
const { blogUpload, listBlogMedia, deleteBlogMedia } = require('../middleware/blogUpload');
const { logActivity } = require('../utils/activityLogger');
const {
  ensureBlogSchema,
  publishDueScheduledArticles,
  syncArticleTags,
  sanitizeArticleHtml,
  stripHtmlToText,
  slugify,
  calculateReadingTime
} = require('../services/blog/blogSchema.service');
const { analyzeArticle } = require('../services/blog/seoAnalyzer.service');

// Initialize schema once and run lightweight scheduled publishing timer
ensureBlogSchema().catch((err) => console.error('[BlogSchema Init Error]:', err.message));
if (!global.__oneslabsBlogSchedulerStarted) {
  global.__oneslabsBlogSchedulerStarted = true;
  setInterval(() => {
    publishDueScheduledArticles().catch(() => {});
  }, 60 * 1000);
}

// Middleware ensuring schema ready for blog endpoints
router.use(async (req, res, next) => {
  try {
    await ensureBlogSchema();
    next();
  } catch (err) {
    console.error('[Blog Schema Middleware Error]:', err);
    res.status(500).json({ message: 'Gagal menginisialisasi sistem database blog.' });
  }
});

const RESERVED_BLOG_SLUGS = new Set(['posts', 'categories', 'tags', 'admin', 'new', 'edit']);

async function generateUniqueSlug(baseTitleOrSlug, excludeId = null) {
  let base = slugify(baseTitleOrSlug || 'artikel-1slabs');
  if (RESERVED_BLOG_SLUGS.has(base)) {
    base = `${base}-artikel`;
  }
  let candidate = base;
  let counter = 2;
  while (true) {
    if (RESERVED_BLOG_SLUGS.has(candidate)) {
      candidate = `${base}-${counter++}`;
      continue;
    }
    const sql = excludeId
      ? 'SELECT id FROM blog_articles WHERE slug = ? AND id != ? LIMIT 1'
      : 'SELECT id FROM blog_articles WHERE slug = ? LIMIT 1';
    const rows = await query(sql, excludeId ? [candidate, excludeId] : [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

async function attachTagsToArticles(articles = []) {
  if (!articles.length) return [];
  const ids = articles.map((a) => a.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagRows = await query(
    `SELECT bat.article_id, bt.id, bt.name, bt.slug
     FROM blog_article_tags bat
     JOIN blog_tags bt ON bt.id = bat.tag_id
     WHERE bat.article_id IN (${placeholders})
     ORDER BY bt.name ASC`,
    ids
  );
  const tagMap = new Map();
  for (const row of tagRows) {
    const arr = tagMap.get(row.article_id) || [];
    arr.push({ id: row.id, name: row.name, slug: row.slug });
    tagMap.set(row.article_id, arr);
  }
  return articles.map((a) => {
    let faqItems = [];
    if (a.faq_schema_json) {
      try {
        const parsed = JSON.parse(a.faq_schema_json);
        if (Array.isArray(parsed)) faqItems = parsed;
      } catch {
        faqItems = [];
      }
    }
    let seoAudit = null;
    if (a.seo_audit_json) {
      try {
        seoAudit = JSON.parse(a.seo_audit_json);
      } catch {
        seoAudit = null;
      }
    }
    let imageAttributions = [];
    if (a.image_attribution_json) {
      try {
        const parsed =
          typeof a.image_attribution_json === 'string'
            ? JSON.parse(a.image_attribution_json)
            : a.image_attribution_json;
        if (Array.isArray(parsed)) imageAttributions = parsed;
      } catch {
        imageAttributions = [];
      }
    }
    return {
      ...a,
      tags: tagMap.get(a.id) || [],
      faq_items: faqItems,
      seo_audit: seoAudit,
      image_attributions: imageAttributions
    };
  });
}

function parseFaqInput(rawFaq) {
  if (!rawFaq) return [];
  if (Array.isArray(rawFaq)) {
    return rawFaq
      .map((item) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim()
      }))
      .filter((item) => item.question && item.answer);
  }
  if (typeof rawFaq === 'string') {
    try {
      const parsed = JSON.parse(rawFaq);
      return parseFaqInput(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeMysqlDatetime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeMysqlDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// =========================================================================
// PUBLIC BLOG ROUTES
// =========================================================================

/**
 * GET /api/blog/categories - List all categories with published article counts
 */
router.get('/categories', async (req, res) => {
  try {
    await publishDueScheduledArticles();
    const categories = await query(
      `SELECT c.*, COUNT(CASE WHEN a.status = 'published' AND COALESCE(a.visibility, 'public') = 'public' THEN 1 END) AS article_count
       FROM blog_categories c
       LEFT JOIN blog_articles a ON a.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({ categories });
  } catch (err) {
    console.error('[GET /blog/categories]', err);
    res.status(500).json({ message: 'Gagal memuat kategori blog.' });
  }
});

/**
 * GET /api/blog/tags - List all tags with published article counts
 */
router.get('/tags', async (req, res) => {
  try {
    await publishDueScheduledArticles();
    const tags = await query(
      `SELECT t.id, t.name, t.slug, COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) AS article_count
       FROM blog_tags t
       LEFT JOIN blog_article_tags bat ON bat.tag_id = t.id
       LEFT JOIN blog_articles a ON a.id = bat.article_id
       GROUP BY t.id
       HAVING article_count > 0
       ORDER BY article_count DESC, t.name ASC`
    );
    res.json({ tags });
  } catch (err) {
    console.error('[GET /blog/tags]', err);
    res.status(500).json({ message: 'Gagal memuat tag artikel.' });
  }
});

/**
 * GET /api/blog/posts - Paginated public blog listing (published only)
 */
router.get('/posts', async (req, res) => {
  try {
    await publishDueScheduledArticles();
    const {
      category = '',
      tag = '',
      search = '',
      featured = '',
      cluster_id = '',
      sort = 'newest',
      page = 1,
      limit = 9
    } = req.query;

    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 9));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const where = ["a.status = 'published'", "COALESCE(a.visibility, 'public') = 'public'"];
    const params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(String(category).trim());
    }
    if (tag) {
      where.push('EXISTS (SELECT 1 FROM blog_article_tags bat2 JOIN blog_tags bt2 ON bt2.id = bat2.tag_id WHERE bat2.article_id = a.id AND bt2.slug = ?)');
      params.push(String(tag).trim());
    }
    if (featured === '1' || featured === 'true') {
      where.push('a.is_featured = 1');
    }
    if (cluster_id) {
      where.push('a.cluster_id = ?');
      params.push(parseInt(cluster_id, 10));
    }
    if (search) {
      const q = `%${String(search).trim()}%`;
      where.push('(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ? OR a.focus_keyphrase LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const orderBy = sort === 'popular'
      ? 'ORDER BY a.views DESC, a.published_at DESC'
      : 'ORDER BY a.is_featured DESC, COALESCE(a.published_at, a.created_at) DESC';

    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const rows = await query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.featured_image_alt,
              a.category_id, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
              a.author_name, a.is_featured, a.views, a.reading_time, a.published_at, a.updated_at, a.created_at,
              a.cluster_id, a.is_pillar
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       ${whereClause}
       ${orderBy}
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const articles = await attachTagsToArticles(rows);

    res.json({
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      }
    });
  } catch (err) {
    console.error('[GET /blog/posts]', err);
    res.status(500).json({ message: 'Gagal mengambil daftar artikel blog.' });
  }
});

/**
 * GET /api/blog/posts/:slug - Public single article detail (or preview with Admin JWT)
 */
router.get('/posts/:slug', optionalAuth, async (req, res) => {
  try {
    await publishDueScheduledArticles();
    const rawSlug = String(req.params.slug || '').trim();
    const isPreviewAllowed =
      req.query.preview === '1' &&
      req.user &&
      (isSuperAdmin(req.user) || isMarketing(req.user));

    const rows = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
              tc.name AS cluster_name, tc.pillar_title AS cluster_pillar_title, tc.pillar_slug AS cluster_pillar_slug
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       LEFT JOIN blog_topic_clusters tc ON tc.id = a.cluster_id
       WHERE a.slug = ?
       LIMIT 1`,
      [rawSlug]
    );

    const article = rows[0];
    const isHidden =
      !article ||
      ((article.status !== 'published' || article.visibility === 'private') && !isPreviewAllowed);
    if (isHidden) {
      // Check active SEO redirect rules before returning 404
      const redirectRows = await query(
        `SELECT * FROM blog_seo_redirects
         WHERE is_active = 1 AND source_path IN (?, ?, ?)
         LIMIT 1`,
        [`/blog/${rawSlug}`, `/artikel/${rawSlug}`, rawSlug]
      );
      if (redirectRows[0]) {
        query('UPDATE blog_seo_redirects SET hits = hits + 1 WHERE id = ?', [redirectRows[0].id]).catch(() => {});
        return res.status(404).json({
          message: 'Artikel dialihkan.',
          redirect: {
            target_url: redirectRows[0].target_url,
            status_code: redirectRows[0].status_code
          }
        });
      }
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    }

    if (article.status === 'published' && req.query.preview !== '1') {
      query('UPDATE blog_articles SET views = views + 1 WHERE id = ?', [article.id]).catch(() => {});
    }

    const [enriched] = await attachTagsToArticles([article]);

    // Prev / Next published articles
    const [prevRows, nextRows, relatedRows] = await Promise.all([
      query(
        `SELECT id, title, slug, featured_image, published_at
         FROM blog_articles
         WHERE status = 'published' AND COALESCE(visibility, 'public') = 'public' AND id != ?
           AND COALESCE(published_at, created_at) < COALESCE(?, created_at)
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`,
        [article.id, article.published_at || article.created_at]
      ),
      query(
        `SELECT id, title, slug, featured_image, published_at
         FROM blog_articles
         WHERE status = 'published' AND COALESCE(visibility, 'public') = 'public' AND id != ?
           AND COALESCE(published_at, created_at) > COALESCE(?, created_at)
         ORDER BY COALESCE(published_at, created_at) ASC LIMIT 1`,
        [article.id, article.published_at || article.created_at]
      ),
      query(
        `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.featured_image_alt,
                a.author_name, a.reading_time, a.published_at, a.updated_at, a.created_at,
                c.name AS category_name, c.slug AS category_slug, c.color AS category_color
         FROM blog_articles a
         LEFT JOIN blog_categories c ON c.id = a.category_id
         WHERE a.status = 'published' AND COALESCE(a.visibility, 'public') = 'public' AND a.id != ?
         ORDER BY (a.category_id = ?) DESC, (a.cluster_id = ?) DESC, COALESCE(a.published_at, a.created_at) DESC
         LIMIT 3`,
        [article.id, article.category_id || 0, article.cluster_id || 0]
      )
    ]);

    res.json({
      article: enriched,
      prevArticle: prevRows[0] || null,
      nextArticle: nextRows[0] || null,
      relatedArticles: relatedRows
    });
  } catch (err) {
    console.error('[GET /blog/posts/:slug]', err);
    res.status(500).json({ message: 'Gagal memuat detail artikel.' });
  }
});

// =========================================================================
// ADMIN / MARKETING BLOG MANAGEMENT ROUTES
// =========================================================================

router.use('/admin', requireAuth, requireAdminOrMarketing);

/**
 * GET /api/blog/admin/authors - List team members eligible as article authors
 */
router.get('/admin/authors', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, email, role
       FROM users
       WHERE role IN ('super_admin', 'admin', 'marketing', 'hr')
       ORDER BY FIELD(role, 'super_admin', 'admin', 'marketing', 'hr'), name ASC`
    );
    res.json({ authors: rows });
  } catch (err) {
    console.error('[GET /blog/admin/authors]', err);
    res.status(500).json({ message: 'Gagal mengambil daftar penulis.' });
  }
});

/**
 * GET /api/blog/admin/posts - Full admin listing with stats, filters & SEO health
 */
router.get('/admin/posts', async (req, res) => {
  try {
    await publishDueScheduledArticles();
    const {
      status = '',
      category_id = '',
      seo_health = '',
      priority = '',
      cluster_id = '',
      search = '',
      sort = 'updated_desc',
      page = 1,
      limit = 20
    } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const where = ['1=1'];
    const params = [];

    if (status && status !== 'all') {
      where.push('a.status = ?');
      params.push(String(status).trim());
    }
    if (category_id && category_id !== 'all') {
      where.push('a.category_id = ?');
      params.push(parseInt(category_id, 10));
    }
    if (priority && priority !== 'all') {
      where.push('a.priority = ?');
      params.push(String(priority).trim());
    }
    if (cluster_id && cluster_id !== 'all') {
      where.push('a.cluster_id = ?');
      params.push(parseInt(cluster_id, 10));
    }
    if (seo_health === 'good') {
      where.push('a.seo_score >= 75');
    } else if (seo_health === 'needs_improvement') {
      where.push('a.seo_score >= 50 AND a.seo_score < 75');
    } else if (seo_health === 'poor') {
      where.push('a.seo_score < 50');
    }
    if (search) {
      const q = `%${String(search).trim()}%`;
      where.push('(a.title LIKE ? OR a.slug LIKE ? OR a.focus_keyphrase LIKE ? OR a.author_name LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const sortMap = {
      updated_desc: 'ORDER BY a.updated_at DESC',
      created_desc: 'ORDER BY a.created_at DESC',
      published_desc: 'ORDER BY COALESCE(a.published_at, a.created_at) DESC',
      seo_desc: 'ORDER BY a.seo_score DESC, a.updated_at DESC',
      seo_asc: 'ORDER BY a.seo_score ASC, a.updated_at DESC',
      views_desc: 'ORDER BY a.views DESC, a.updated_at DESC',
      due_asc: 'ORDER BY (a.due_date IS NULL) ASC, a.due_date ASC',
      title_asc: 'ORDER BY a.title ASC'
    };
    const orderBy = sortMap[sort] || sortMap.updated_desc;

    const [countRows, statsRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM blog_articles a ${whereClause}`, params),
      query(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_count,
          SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_count,
          SUM(CASE WHEN status = 'needs_revision' THEN 1 ELSE 0 END) AS needs_revision_count,
          SUM(CASE WHEN status = 'ideas' THEN 1 ELSE 0 END) AS ideas_count,
          ROUND(AVG(seo_score), 0) AS avg_seo_score,
          ROUND(AVG(readability_score), 0) AS avg_readability_score,
          ROUND(AVG(geo_score), 0) AS avg_geo_score,
          SUM(CASE WHEN seo_score >= 75 THEN 1 ELSE 0 END) AS good_seo_count,
          SUM(CASE WHEN seo_score >= 50 AND seo_score < 75 THEN 1 ELSE 0 END) AS warning_seo_count,
          SUM(CASE WHEN seo_score < 50 THEN 1 ELSE 0 END) AS poor_seo_count,
          SUM(views) AS total_views
        FROM blog_articles
      `),
      query(
        `SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
                tc.name AS cluster_name
         FROM blog_articles a
         LEFT JOIN blog_categories c ON c.id = a.category_id
         LEFT JOIN blog_topic_clusters tc ON tc.id = a.cluster_id
         ${whereClause}
         ${orderBy}
         LIMIT ${limitNum} OFFSET ${offset}`,
        params
      )
    ]);

    const articles = await attachTagsToArticles(rows);
    const total = Number(countRows[0]?.total || 0);

    res.json({
      articles,
      stats: statsRows[0] || {},
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      }
    });
  } catch (err) {
    console.error('[GET /blog/admin/posts]', err);
    res.status(500).json({ message: 'Gagal memuat manajemen artikel.' });
  }
});

/**
 * GET /api/blog/admin/posts/:id - Full article detail + revisions summary for editor
 */
router.get('/admin/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
              tc.name AS cluster_name
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       LEFT JOIN blog_topic_clusters tc ON tc.id = a.cluster_id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    }
    const [article] = await attachTagsToArticles(rows);
    const revCountRows = await query(
      'SELECT COUNT(*) AS count FROM blog_article_revisions WHERE article_id = ?',
      [id]
    );
    res.json({
      article: {
        ...article,
        revision_count: Number(revCountRows[0]?.count || 0)
      }
    });
  } catch (err) {
    console.error('[GET /blog/admin/posts/:id]', err);
    res.status(500).json({ message: 'Gagal mengambil detail artikel.' });
  }
});

/**
 * POST /api/blog/admin/posts - Create article & compute deterministic SEO/GEO metrics
 */
router.post('/admin/posts', async (req, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Judul artikel wajib diisi.' });
    }

    const cleanHtml = sanitizeArticleHtml(b.content || '');
    const slug = await generateUniqueSlug(b.slug || title);
    const status = ['ideas', 'draft', 'in_review', 'needs_revision', 'scheduled', 'published'].includes(b.status)
      ? b.status
      : 'draft';
    const visibility = ['public', 'unlisted', 'private'].includes(b.visibility)
      ? b.visibility
      : 'public';

    let publishedAt = normalizeMysqlDatetime(b.published_at);
    if (status === 'published' && !publishedAt) {
      publishedAt = normalizeMysqlDatetime(new Date());
    }

    const plain = stripHtmlToText(cleanHtml);
    const excerpt = b.excerpt && String(b.excerpt).trim()
      ? String(b.excerpt).trim()
      : (plain ? plain.slice(0, 180) + (plain.length > 180 ? '...' : '') : '');

    const faqItems = parseFaqInput(b.faq_items || b.faq_schema_json);
    const faqJson = faqItems.length > 0 ? JSON.stringify(faqItems) : null;
    const readingTime = calculateReadingTime(cleanHtml);

    const analysis = analyzeArticle({
      title,
      slug,
      excerpt,
      content: cleanHtml,
      featured_image: b.featured_image || '',
      featured_image_alt: b.featured_image_alt || '',
      author_name: b.author_name || req.user?.name || 'Tim Editorial 1sLabs',
      meta_title: b.meta_title || '',
      meta_description: b.meta_description || '',
      focus_keyphrase: b.focus_keyphrase || '',
      faq_items: faqItems
    });

    const result = await query(
      `INSERT INTO blog_articles
       (title, slug, excerpt, content, featured_image, featured_image_alt, featured_image_caption, category_id, author_id, author_name,
        status, visibility, priority, due_date, editorial_notes, is_featured, reading_time,
        meta_title, meta_description, focus_keyphrase, secondary_keyphrases, canonical_url, robots_directive,
        og_title, og_description, og_image, schema_type, faq_schema_json,
        seo_score, readability_score, geo_score, seo_audit_json, seo_audit_at,
        cluster_id, is_pillar, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [
        title,
        slug,
        excerpt,
        cleanHtml,
        b.featured_image || null,
        b.featured_image_alt || null,
        b.featured_image_caption || null,
        b.category_id ? parseInt(b.category_id, 10) : null,
        b.author_id ? parseInt(b.author_id, 10) : (req.user?.id || null),
        b.author_name || req.user?.name || 'Tim Editorial 1sLabs',
        status,
        visibility,
        ['low', 'medium', 'high', 'urgent'].includes(b.priority) ? b.priority : 'medium',
        normalizeMysqlDate(b.due_date),
        b.editorial_notes || null,
        b.is_featured ? 1 : 0,
        readingTime,
        b.meta_title || null,
        b.meta_description || null,
        b.focus_keyphrase || null,
        b.secondary_keyphrases || null,
        b.canonical_url || null,
        b.robots_directive || 'index,follow',
        b.og_title || null,
        b.og_description || null,
        b.og_image || null,
        b.schema_type || 'BlogPosting',
        faqJson,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        JSON.stringify(analysis),
        b.cluster_id ? parseInt(b.cluster_id, 10) : null,
        b.is_pillar ? 1 : 0,
        publishedAt
      ]
    );

    const newId = result.insertId;
    if (Array.isArray(b.tags)) {
      await syncArticleTags(newId, b.tags);
    }

    const createRevType = b.is_autosave === true ? 'autosave' : 'manual';
    await query(
      `INSERT INTO blog_article_revisions
       (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase,
        seo_score, readability_score, geo_score, change_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.user?.id || null,
        req.user?.name || 'Administrator',
        createRevType,
        title,
        excerpt,
        cleanHtml,
        b.meta_title || null,
        b.meta_description || null,
        b.focus_keyphrase || null,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        createRevType === 'autosave' ? 'Draft dibuat otomatis' : 'Artikel dibuat'
      ]
    );

    if (createRevType !== 'autosave') {
      await logActivity({
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorRole: req.user?.role,
        action: 'CREATE_BLOG_ARTICLE',
        target: `blog_article:${newId}`,
        details: { title, slug, status, seo_score: analysis.seo_score },
        ip: req.ip
      });
    }

    const createdRows = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [newId]);
    const [created] = await attachTagsToArticles(createdRows);
    res.status(201).json({ article: created, analysis });
  } catch (err) {
    console.error('[POST /blog/admin/posts]', err);
    res.status(500).json({ message: 'Gagal menyimpan artikel baru: ' + err.message });
  }
});

/**
 * PUT /api/blog/admin/posts/:id - Full update + revision tracking
 */
router.put('/admin/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRows = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    }

    const b = req.body || {};
    const title = b.title !== undefined ? String(b.title).trim() : existing.title;
    if (!title) {
      return res.status(400).json({ message: 'Judul artikel tidak boleh kosong.' });
    }

    const cleanHtml = b.content !== undefined ? sanitizeArticleHtml(b.content) : existing.content;
    const requestedSlug = b.slug !== undefined ? String(b.slug).trim() : existing.slug;
    const slug = requestedSlug && requestedSlug !== existing.slug
      ? await generateUniqueSlug(requestedSlug, id)
      : existing.slug;

    const status = b.status && ['ideas', 'draft', 'in_review', 'needs_revision', 'scheduled', 'published'].includes(b.status)
      ? b.status
      : existing.status;
    const visibility = b.visibility && ['public', 'unlisted', 'private'].includes(b.visibility)
      ? b.visibility
      : (existing.visibility || 'public');
    const isAutosave = b.is_autosave === true;

    let publishedAt = b.published_at !== undefined
      ? normalizeMysqlDatetime(b.published_at)
      : normalizeMysqlDatetime(existing.published_at);
    if (status === 'published' && !publishedAt) {
      publishedAt = normalizeMysqlDatetime(new Date());
    }

    const faqItems = (b.faq_items !== undefined || b.faq_schema_json !== undefined)
      ? parseFaqInput(b.faq_items ?? b.faq_schema_json)
      : parseFaqInput(existing.faq_schema_json);
    const faqJson = faqItems.length > 0 ? JSON.stringify(faqItems) : null;

    const metaTitle = b.meta_title !== undefined ? b.meta_title : existing.meta_title;
    const metaDesc = b.meta_description !== undefined ? b.meta_description : existing.meta_description;
    const focusKey = b.focus_keyphrase !== undefined ? b.focus_keyphrase : existing.focus_keyphrase;
    const excerpt = b.excerpt !== undefined ? b.excerpt : existing.excerpt;
    const featuredImage = b.featured_image !== undefined ? b.featured_image : existing.featured_image;
    const featuredImageAlt = b.featured_image_alt !== undefined ? b.featured_image_alt : existing.featured_image_alt;
    const featuredImageCaption = b.featured_image_caption !== undefined ? b.featured_image_caption : existing.featured_image_caption;
    const authorName = b.author_name !== undefined ? b.author_name : existing.author_name;
    const readingTime = calculateReadingTime(cleanHtml);

    const analysis = analyzeArticle({
      title,
      slug,
      excerpt,
      content: cleanHtml,
      featured_image: featuredImage,
      featured_image_alt: featuredImageAlt,
      author_name: authorName,
      meta_title: metaTitle,
      meta_description: metaDesc,
      focus_keyphrase: focusKey,
      faq_items: faqItems
    });

    await query(
      `UPDATE blog_articles
       SET title = ?, slug = ?, excerpt = ?, content = ?,
           featured_image = ?, featured_image_alt = ?, featured_image_caption = ?,
           category_id = ?, author_id = ?, author_name = ?,
           status = ?, visibility = ?, priority = ?, due_date = ?, editorial_notes = ?, is_featured = ?, reading_time = ?,
           meta_title = ?, meta_description = ?, focus_keyphrase = ?, secondary_keyphrases = ?,
           canonical_url = ?, robots_directive = ?, og_title = ?, og_description = ?, og_image = ?,
           schema_type = ?, faq_schema_json = ?,
           seo_score = ?, readability_score = ?, geo_score = ?, seo_audit_json = ?, seo_audit_at = NOW(),
           cluster_id = ?, is_pillar = ?, published_at = ?
       WHERE id = ?`,
      [
        title,
        slug,
        excerpt || null,
        cleanHtml,
        featuredImage || null,
        featuredImageAlt || null,
        featuredImageCaption || null,
        b.category_id !== undefined ? (b.category_id ? parseInt(b.category_id, 10) : null) : existing.category_id,
        b.author_id !== undefined ? (b.author_id ? parseInt(b.author_id, 10) : null) : existing.author_id,
        authorName,
        status,
        visibility,
        b.priority && ['low', 'medium', 'high', 'urgent'].includes(b.priority) ? b.priority : existing.priority,
        b.due_date !== undefined ? normalizeMysqlDate(b.due_date) : normalizeMysqlDate(existing.due_date),
        b.editorial_notes !== undefined ? b.editorial_notes : existing.editorial_notes,
        b.is_featured !== undefined ? (b.is_featured ? 1 : 0) : existing.is_featured,
        readingTime,
        metaTitle || null,
        metaDesc || null,
        focusKey || null,
        b.secondary_keyphrases !== undefined ? b.secondary_keyphrases : existing.secondary_keyphrases,
        b.canonical_url !== undefined ? b.canonical_url : existing.canonical_url,
        b.robots_directive !== undefined ? b.robots_directive : existing.robots_directive,
        b.og_title !== undefined ? b.og_title : existing.og_title,
        b.og_description !== undefined ? b.og_description : existing.og_description,
        b.og_image !== undefined ? b.og_image : existing.og_image,
        b.schema_type !== undefined ? b.schema_type : existing.schema_type,
        faqJson,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        JSON.stringify(analysis),
        b.cluster_id !== undefined ? (b.cluster_id ? parseInt(b.cluster_id, 10) : null) : existing.cluster_id,
        b.is_pillar !== undefined ? (b.is_pillar ? 1 : 0) : existing.is_pillar,
        publishedAt,
        id
      ]
    );

    if (Array.isArray(b.tags)) {
      await syncArticleTags(id, b.tags);
    }

    // Save revision snapshot (throttled when is_autosave=true to prevent revision spam)
    const revType = isAutosave
      ? 'autosave'
      : (['manual', 'ai_optimize', 'autosave', 'revert'].includes(b.revision_type)
        ? b.revision_type
        : 'manual');
    const contentOrMetaChanged =
      title !== existing.title ||
      cleanHtml !== existing.content ||
      String(metaTitle || '') !== String(existing.meta_title || '') ||
      String(metaDesc || '') !== String(existing.meta_description || '') ||
      revType === 'ai_optimize';

    let shouldSaveRevision = contentOrMetaChanged && b.skip_revision !== true;
    if (shouldSaveRevision && isAutosave) {
      const lastAuto = await query(
        `SELECT created_at FROM blog_article_revisions
         WHERE article_id = ? AND revision_type = 'autosave'
         ORDER BY created_at DESC LIMIT 1`,
        [id]
      );
      if (lastAuto[0]?.created_at) {
        const ageMs = Date.now() - new Date(lastAuto[0].created_at).getTime();
        if (ageMs < 3 * 60 * 1000) {
          shouldSaveRevision = false;
        }
      }
    }

    if (shouldSaveRevision) {
      await query(
        `INSERT INTO blog_article_revisions
         (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase,
          seo_score, readability_score, geo_score, change_summary, diff_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          req.user?.id || null,
          req.user?.name || 'Administrator',
          revType,
          title,
          excerpt || null,
          cleanHtml,
          metaTitle || null,
          metaDesc || null,
          focusKey || null,
          analysis.seo_score,
          analysis.readability_score,
          analysis.geo_score,
          b.change_summary ||
            (revType === 'ai_optimize'
              ? 'Optimasi AI 1-Klik diterapkan'
              : revType === 'autosave'
                ? 'Simpan otomatis'
                : 'Pembaruan artikel'),
          b.diff_json ? (typeof b.diff_json === 'string' ? b.diff_json : JSON.stringify(b.diff_json)) : null
        ]
      );
    }

    if (!isAutosave) {
      await logActivity({
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorRole: req.user?.role,
        action: revType === 'ai_optimize' ? 'AI_OPTIMIZE_BLOG_ARTICLE' : 'UPDATE_BLOG_ARTICLE',
        target: `blog_article:${id}`,
        details: { title, slug, status, visibility, seo_score: analysis.seo_score },
        ip: req.ip
      });
    }

    const updatedRows = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    const [updated] = await attachTagsToArticles(updatedRows);
    res.json({ article: updated, analysis });
  } catch (err) {
    console.error('[PUT /blog/admin/posts/:id]', err);
    res.status(500).json({ message: 'Gagal memperbarui artikel: ' + err.message });
  }
});

/**
 * PATCH /api/blog/admin/posts/:id/status - Kanban drag/drop & quick publish/schedule toggle
 */
router.patch('/admin/posts/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRows = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    }

    const { status, priority, due_date, editorial_notes, published_at, author_name, author_id } = req.body || {};
    if (status && !['ideas', 'draft', 'in_review', 'needs_revision', 'scheduled', 'published'].includes(status)) {
      return res.status(400).json({ message: 'Status pipeline tidak valid.' });
    }

    const nextStatus = status || existing.status;
    let nextPublishedAt = published_at !== undefined
      ? normalizeMysqlDatetime(published_at)
      : normalizeMysqlDatetime(existing.published_at);

    if (nextStatus === 'published' && !nextPublishedAt) {
      nextPublishedAt = normalizeMysqlDatetime(new Date());
    }
    if (nextStatus === 'scheduled' && !nextPublishedAt) {
      return res.status(400).json({ message: 'Tanggal & jam jadwal terbit wajib diisi untuk status Scheduled.' });
    }

    await query(
      `UPDATE blog_articles
       SET status = ?,
           priority = ?,
           due_date = ?,
           editorial_notes = ?,
           published_at = ?,
           author_name = ?,
           author_id = ?
       WHERE id = ?`,
      [
        nextStatus,
        priority && ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : existing.priority,
        due_date !== undefined ? normalizeMysqlDate(due_date) : normalizeMysqlDate(existing.due_date),
        editorial_notes !== undefined ? editorial_notes : existing.editorial_notes,
        nextPublishedAt,
        author_name !== undefined ? author_name : existing.author_name,
        author_id !== undefined ? (author_id ? parseInt(author_id, 10) : null) : existing.author_id,
        id
      ]
    );

    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'MOVE_EDITORIAL_CARD',
      target: `blog_article:${id}`,
      details: { from: existing.status, to: nextStatus, priority: priority || existing.priority },
      ip: req.ip
    });

    const updatedRows = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    const [updated] = await attachTagsToArticles(updatedRows);
    res.json({ article: updated });
  } catch (err) {
    console.error('[PATCH /blog/admin/posts/:id/status]', err);
    res.status(500).json({ message: 'Gagal memperbarui status artikel.' });
  }
});

/**
 * DELETE /api/blog/admin/posts/:id
 */
router.delete('/admin/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await query('SELECT id, title, slug FROM blog_articles WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
    }

    await query('DELETE FROM blog_articles WHERE id = ?', [id]);

    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'DELETE_BLOG_ARTICLE',
      target: `blog_article:${id}`,
      details: { title: rows[0].title, slug: rows[0].slug },
      ip: req.ip
    });

    res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (err) {
    console.error('[DELETE /blog/admin/posts/:id]', err);
    res.status(500).json({ message: 'Gagal menghapus artikel.' });
  }
});

/**
 * GET /api/blog/admin/posts/:id/revisions
 */
router.get('/admin/posts/:id/revisions', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const revisions = await query(
      `SELECT id, article_id, editor_id, editor_name, revision_type, title, excerpt,
              meta_title, meta_description, focus_keyphrase,
              seo_score, readability_score, geo_score, change_summary, diff_json, created_at
       FROM blog_article_revisions
       WHERE article_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 30`,
      [id]
    );
    res.json({ revisions });
  } catch (err) {
    console.error('[GET /blog/admin/posts/:id/revisions]', err);
    res.status(500).json({ message: 'Gagal mengambil riwayat revisi.' });
  }
});

/**
 * POST /api/blog/admin/posts/:id/revert/:revisionId
 */
router.post('/admin/posts/:id/revert/:revisionId', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const revisionId = parseInt(req.params.revisionId, 10);

    const [articleRows, revRows] = await Promise.all([
      query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [id]),
      query('SELECT * FROM blog_article_revisions WHERE id = ? AND article_id = ? LIMIT 1', [revisionId, id])
    ]);

    const existing = articleRows[0];
    const rev = revRows[0];
    if (!existing || !rev) {
      return res.status(404).json({ message: 'Artikel atau versi revisi tidak ditemukan.' });
    }

    const analysis = analyzeArticle({
      ...existing,
      title: rev.title,
      excerpt: rev.excerpt,
      content: rev.content,
      meta_title: rev.meta_title,
      meta_description: rev.meta_description,
      focus_keyphrase: rev.focus_keyphrase
    });

    await query(
      `UPDATE blog_articles
       SET title = ?, excerpt = ?, content = ?,
           meta_title = ?, meta_description = ?, focus_keyphrase = ?,
           reading_time = ?, seo_score = ?, readability_score = ?, geo_score = ?,
           seo_audit_json = ?, seo_audit_at = NOW()
       WHERE id = ?`,
      [
        rev.title,
        rev.excerpt,
        rev.content,
        rev.meta_title,
        rev.meta_description,
        rev.focus_keyphrase,
        calculateReadingTime(rev.content || ''),
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        JSON.stringify(analysis),
        id
      ]
    );

    await query(
      `INSERT INTO blog_article_revisions
       (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase,
        seo_score, readability_score, geo_score, change_summary)
       VALUES (?, ?, ?, 'revert', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user?.id || null,
        req.user?.name || 'Administrator',
        rev.title,
        rev.excerpt,
        rev.content,
        rev.meta_title,
        rev.meta_description,
        rev.focus_keyphrase,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        `Revert ke revisi #${rev.id} (${rev.revision_type})`
      ]
    );

    const updatedRows = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [id]);
    const [updated] = await attachTagsToArticles(updatedRows);

    res.json({ article: updated, analysis, message: 'Artikel berhasil dikembalikan ke versi sebelumnya.' });
  } catch (err) {
    console.error('[POST /blog/admin/posts/:id/revert/:revisionId]', err);
    res.status(500).json({ message: 'Gagal melakukan revert artikel.' });
  }
});

// =========================================================================
// CATEGORIES CRUD (ADMIN)
// =========================================================================

router.post('/admin/categories', async (req, res) => {
  try {
    const { name, slug: customSlug, description = '', color = '#2563eb', sort_order = 0 } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }
    const cleanSlug = slugify(customSlug || name);
    const result = await query(
      `INSERT INTO blog_categories (name, slug, description, color, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [String(name).trim(), cleanSlug, description, color, parseInt(sort_order, 10) || 0]
    );
    const [created] = await query('SELECT * FROM blog_categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ category: created });
  } catch (err) {
    console.error('[POST /blog/admin/categories]', err);
    res.status(500).json({ message: 'Gagal menambah kategori (pastikan slug unik).' });
  }
});

router.put('/admin/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, slug: customSlug, description, color, sort_order } = req.body || {};
    const existing = await query('SELECT * FROM blog_categories WHERE id = ? LIMIT 1', [id]);
    if (!existing[0]) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });

    await query(
      `UPDATE blog_categories
       SET name = ?, slug = ?, description = ?, color = ?, sort_order = ?
       WHERE id = ?`,
      [
        name !== undefined ? String(name).trim() : existing[0].name,
        customSlug !== undefined ? slugify(customSlug) : existing[0].slug,
        description !== undefined ? description : existing[0].description,
        color !== undefined ? color : existing[0].color,
        sort_order !== undefined ? parseInt(sort_order, 10) : existing[0].sort_order,
        id
      ]
    );
    const [updated] = await query('SELECT * FROM blog_categories WHERE id = ?', [id]);
    res.json({ category: updated });
  } catch (err) {
    console.error('[PUT /blog/admin/categories/:id]', err);
    res.status(500).json({ message: 'Gagal memperbarui kategori.' });
  }
});

router.delete('/admin/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM blog_categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /blog/admin/categories/:id]', err);
    res.status(500).json({ message: 'Gagal menghapus kategori.' });
  }
});

// =========================================================================
// BLOG MEDIA LIBRARY UPLOAD / LIST / DELETE (ADMIN)
// =========================================================================

router.post('/admin/media/upload', (req, res) => {
  blogUpload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload gambar gagal.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'File gambar tidak ditemukan pada request.' });
    }
    res.status(201).json({
      filename: req.file.filename,
      url: `/uploads/blog/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

router.get('/admin/media', async (req, res) => {
  try {
    const scope = String(req.query.scope || 'all');
    const items = listBlogMedia(scope);
    const metaRows = await query(
      `SELECT local_url, role, provider, license_name, photographer_name, attribution_text, alt_text, caption, width, height
       FROM article_images
       WHERE is_selected = 1 AND local_url IS NOT NULL
       ORDER BY id DESC
       LIMIT 300`
    ).catch(() => []);
    const metaByUrl = new Map(metaRows.map((m) => [m.local_url, m]));
    const enriched = items.map((it) => {
      const m = metaByUrl.get(it.url);
      return m
        ? {
            ...it,
            role: m.role,
            provider: m.provider,
            license_name: m.license_name,
            photographer_name: m.photographer_name,
            attribution_text: m.attribution_text,
            alt_text: m.alt_text,
            caption: m.caption,
            width: m.width,
            height: m.height
          }
        : it;
    });
    res.json({ media: enriched });
  } catch (err) {
    console.error('[GET /blog/admin/media]', err);
    res.status(500).json({ message: 'Gagal membaca Media Library.' });
  }
});

router.delete('/admin/media/:filename', (req, res) => {
  try {
    const deleted = deleteBlogMedia(req.params.filename);
    if (!deleted) {
      return res.status(404).json({ message: 'File media tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /blog/admin/media/:filename]', err);
    res.status(400).json({ message: err.message || 'Gagal menghapus file media.' });
  }
});

module.exports = router;

