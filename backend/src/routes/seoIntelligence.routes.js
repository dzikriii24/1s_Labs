const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireAdminOrMarketing } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const {
  ensureBlogSchema,
  publishDueScheduledArticles,
  slugify,
  stripHtmlToText
} = require('../services/blog/blogSchema.service');
const { analyzeArticle } = require('../services/blog/seoAnalyzer.service');
const {
  runAiSeoAudit,
  runAiAssist,
  runOneClickOptimize,
  generateAiContentIdeas
} = require('../services/blog/blogAi.service');
const gscService = require('../services/blog/gsc.service');
const gscExtended = require('../services/blog/gscExtended.service');

const PUBLIC_BASE_URL = (process.env.PUBLIC_SITE_URL || 'https://1slabs.my.id').replace(/\/+$/, '');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.use(async (req, res, next) => {
  try {
    await ensureBlogSchema();
    next();
  } catch (err) {
    console.error('[SEO Schema Middleware Error]:', err);
    res.status(500).json({ message: 'Gagal menginisialisasi tabel SEO Intelligence.' });
  }
});

// =========================================================================
// PUBLIC TECHNICAL SEO ENDPOINTS (NO AUTH)
// =========================================================================

/**
 * GET /api/seo-intelligence/gsc/callback - Google OAuth2 callback (secured by DB CSRF oauth_state)
 */
router.get('/gsc/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`/admin?tab=blog-seo&gsc=error&message=${encodeURIComponent(String(error))}`);
    }
    if (!code || !state) {
      return res.redirect('/admin?tab=blog-seo&gsc=error&message=Missing+code+or+state');
    }
    await gscService.handleOAuthCallback(req, {
      code: String(code),
      state: String(state)
    });
    return res.redirect('/admin?tab=blog-seo&gsc=connected');
  } catch (err) {
    console.error('[GSC OAuth Callback Error]', err.message);
    return res.redirect(`/admin?tab=blog-seo&gsc=error&message=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/seo-intelligence/sitemap.xml & /api/sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    await publishDueScheduledArticles();

    const staticUrls = [
      { loc: '/', changefreq: 'weekly', priority: '1.0' },
      { loc: '/hosting', changefreq: 'weekly', priority: '0.9' },
      { loc: '/blog', changefreq: 'daily', priority: '0.9' },
      { loc: '/docs', changefreq: 'weekly', priority: '0.8' },
      { loc: '/schedule', changefreq: 'monthly', priority: '0.7' },
      { loc: '/service/website-development', changefreq: 'monthly', priority: '0.8' },
      { loc: '/service/custom-web-app', changefreq: 'monthly', priority: '0.8' },
      { loc: '/service/maintenance', changefreq: 'monthly', priority: '0.7' },
      { loc: '/service/cloud-devops', changefreq: 'monthly', priority: '0.7' }
    ];

    const [articles, categories] = await Promise.all([
      query(
        `SELECT slug, updated_at, published_at, featured_image, title
         FROM blog_articles
         WHERE status = 'published'
           AND COALESCE(visibility, 'public') = 'public'
           AND COALESCE(robots_directive, 'index,follow') NOT LIKE '%noindex%'
         ORDER BY COALESCE(published_at, created_at) DESC`
      ),
      query('SELECT slug, created_at FROM blog_categories ORDER BY sort_order ASC')
    ]);

    let docSlugs = [];
    try {
      docSlugs = await query(
        `SELECT slug, updated_at FROM documentation_articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 200`
      );
    } catch {
      try {
        docSlugs = await query(
          `SELECT slug, updated_at FROM documentation_articles WHERE is_published = 1 ORDER BY updated_at DESC LIMIT 200`
        );
      } catch {
        docSlugs = [];
      }
    }

    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
    ];

    const today = new Date().toISOString().slice(0, 10);
    for (const u of staticUrls) {
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(PUBLIC_BASE_URL + u.loc)}</loc>`);
      lines.push(`    <lastmod>${today}</lastmod>`);
      lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
      lines.push(`    <priority>${u.priority}</priority>`);
      lines.push('  </url>');
    }

    for (const cat of categories) {
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(`${PUBLIC_BASE_URL}/blog?category=${encodeURIComponent(cat.slug)}`)}</loc>`);
      lines.push(`    <changefreq>weekly</changefreq>`);
      lines.push('    <priority>0.6</priority>');
      lines.push('  </url>');
    }

    for (const art of articles) {
      const lastmod = new Date(art.updated_at || art.published_at || Date.now()).toISOString().slice(0, 10);
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(`${PUBLIC_BASE_URL}/blog/${art.slug}`)}</loc>`);
      lines.push(`    <lastmod>${lastmod}</lastmod>`);
      lines.push('    <changefreq>weekly</changefreq>');
      lines.push('    <priority>0.8</priority>');
      if (art.featured_image) {
        const imgUrl = /^https?:\/\//i.test(art.featured_image)
          ? art.featured_image
          : `${PUBLIC_BASE_URL}${art.featured_image.startsWith('/') ? '' : '/'}${art.featured_image}`;
        lines.push('    <image:image>');
        lines.push(`      <image:loc>${escapeXml(imgUrl)}</image:loc>`);
        lines.push(`      <image:title>${escapeXml(art.title)}</image:title>`);
        lines.push('    </image:image>');
      }
      lines.push('  </url>');
    }

    for (const doc of docSlugs) {
      if (!doc.slug) continue;
      const lastmod = new Date(doc.updated_at || Date.now()).toISOString().slice(0, 10);
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(`${PUBLIC_BASE_URL}/docs/${doc.slug}`)}</loc>`);
      lines.push(`    <lastmod>${lastmod}</lastmod>`);
      lines.push('    <changefreq>monthly</changefreq>');
      lines.push('    <priority>0.6</priority>');
      lines.push('  </url>');
    }

    lines.push('</urlset>');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(lines.join('\n'));
  } catch (err) {
    console.error('[GET /sitemap.xml]', err);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

/**
 * GET /api/seo-intelligence/robots.txt & /api/robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const txt = [
    '# 1sLabs Search & AI Crawler Directives',
    'User-agent: *',
    'Allow: /',
    'Allow: /blog',
    'Allow: /blog/',
    'Allow: /docs',
    'Allow: /hosting',
    'Disallow: /admin',
    'Disallow: /portal',
    'Disallow: /api/',
    '',
    'User-agent: GPTBot',
    'Allow: /blog/',
    'Allow: /docs/',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /blog/',
    'Allow: /docs/',
    '',
    'User-agent: PerplexityBot',
    'Allow: /blog/',
    'Allow: /docs/',
    '',
    `Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml`
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.send(txt);
});

/**
 * Crawler SSR metadata + JSON-LD + HTTP 404/301 handler.
 * Handles both direct /meta-render?path=... and Passenger rewritten /blog/:slug paths.
 */
async function renderCrawlerMeta(req, res, forcedPath = null) {
  try {
    await ensureBlogSchema();
    await publishDueScheduledArticles();
    const rawPath = String(forcedPath || req.query.path || req.originalUrl || '/blog').split('?')[0];
    const cleanPath = '/' + rawPath.replace(/^\/+|\/+$/g, '');

    // Check active redirects
    const redirRows = await query(
      `SELECT * FROM blog_seo_redirects WHERE is_active = 1 AND source_path = ? LIMIT 1`,
      [cleanPath]
    );
    if (redirRows[0]) {
      query('UPDATE blog_seo_redirects SET hits = hits + 1 WHERE id = ?', [redirRows[0].id]).catch(() => {});
      const target = redirRows[0].target_url.startsWith('/')
        ? `${PUBLIC_BASE_URL}${redirRows[0].target_url}`
        : redirRows[0].target_url;
      return res.redirect(Number(redirRows[0].status_code) === 302 ? 302 : 301, target);
    }

    // Blog index page
    if (cleanPath === '/blog' || cleanPath === '/artikel') {
      const recent = await query(
        `SELECT title, slug, excerpt, published_at FROM blog_articles
         WHERE status = 'published' AND COALESCE(visibility, 'public') = 'public'
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 12`
      );
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Blog &amp; Engineering Insights | 1sLabs Indonesia</title>
  <meta name="description" content="Artikel teknis, panduan managed hosting, arsitektur software custom, dan strategi SEO/GEO untuk bisnis digital Indonesia oleh tim engineering 1sLabs." />
  <link rel="canonical" href="${PUBLIC_BASE_URL}/blog" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Blog &amp; Engineering Insights | 1sLabs Indonesia" />
  <meta property="og:description" content="Artikel teknis, panduan managed hosting, arsitektur software custom, dan strategi SEO/GEO oleh 1sLabs." />
  <meta property="og:url" content="${PUBLIC_BASE_URL}/blog" />
  <meta property="og:site_name" content="1sLabs" />
</head>
<body>
  <main>
    <h1>Blog &amp; Wawasan Teknologi 1sLabs</h1>
    <p>Panduan software engineering, managed hosting, dan optimasi SEO/GEO untuk bisnis di Indonesia.</p>
    <ul>
      ${recent.map((r) => `<li><a href="${PUBLIC_BASE_URL}/blog/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a> - ${escapeHtml(r.excerpt || '')}</li>`).join('\n      ')}
    </ul>
  </main>
</body>
</html>`;
      return res.status(200).type('text/html').send(html);
    }

    // Article detail /blog/:slug or /artikel/:slug
    const slugMatch = cleanPath.match(/^\/(?:blog|artikel)\/([^/]+)$/);
    const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : String(req.query.slug || '').trim();
    if (!slug) {
      return res.status(404).type('text/html').send('<!DOCTYPE html><html><head><meta name="robots" content="noindex,nofollow"><title>404 Not Found</title></head><body><h1>404 - Artikel Tidak Ditemukan</h1></body></html>');
    }

    const rows = await query(
      `SELECT a.*, c.name AS category_name
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       WHERE a.slug = ? AND a.status = 'published' AND COALESCE(a.visibility, 'public') != 'private' LIMIT 1`,
      [slug]
    );
    const article = rows[0];
    if (!article) {
      return res.status(404).type('text/html').send(
        `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Artikel Tidak Ditemukan | 1sLabs</title></head><body><h1>404 - Artikel Tidak Ditemukan</h1><p>Halaman yang Anda cari belum tersedia atau telah dihapus.</p><a href="${PUBLIC_BASE_URL}/blog">Kembali ke Blog 1sLabs</a></body></html>`
      );
    }

    const canonical = article.canonical_url || `${PUBLIC_BASE_URL}/blog/${article.slug}`;
    const seoTitle = article.meta_title || article.title;
    const seoDesc = article.meta_description || article.excerpt || stripHtmlToText(article.content || '').slice(0, 155);
    const ogImgRaw = article.og_image || article.featured_image || `${PUBLIC_BASE_URL}/logo-1slabs.png`;
    const ogImg = /^https?:\/\//i.test(ogImgRaw)
      ? ogImgRaw
      : `${PUBLIC_BASE_URL}${ogImgRaw.startsWith('/') ? '' : '/'}${ogImgRaw}`;

    const publishedIso = new Date(article.published_at || article.created_at).toISOString();
    const modifiedIso = new Date(article.updated_at || article.published_at || article.created_at).toISOString();

    let faqItems = [];
    if (article.faq_schema_json) {
      try {
        const parsed = JSON.parse(article.faq_schema_json);
        if (Array.isArray(parsed)) faqItems = parsed;
      } catch {
        faqItems = [];
      }
    }

    const graph = [
      {
        '@type': article.schema_type || 'BlogPosting',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        headline: seoTitle,
        description: seoDesc,
        image: ogImg,
        author: { '@type': 'Person', name: article.author_name || 'Tim Editorial 1sLabs' },
        publisher: {
          '@type': 'Organization',
          name: '1sLabs',
          logo: { '@type': 'ImageObject', url: `${PUBLIC_BASE_URL}/logo-1slabs.png` }
        },
        datePublished: publishedIso,
        dateModified: modifiedIso
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PUBLIC_BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonical }
        ]
      }
    ];

    if (faqItems.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        }))
      });
    }

    const ldJson = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/<\//g, '<\\/');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(seoTitle)} | 1sLabs</title>
  <meta name="description" content="${escapeHtml(seoDesc)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta name="robots" content="${escapeHtml(article.visibility === 'unlisted' ? 'noindex, nofollow' : (article.robots_directive || 'index, follow'))}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(article.og_title || seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(article.og_description || seoDesc)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(ogImg)}" />
  <meta property="og:site_name" content="1sLabs" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(seoDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImg)}" />
  <script type="application/ld+json">${ldJson}</script>
</head>
<body>
  <article>
    <h1>${escapeHtml(article.title)}</h1>
    <p><strong>Penulis:</strong> ${escapeHtml(article.author_name || 'Tim Editorial 1sLabs')}${article.category_name ? ` | <strong>Kategori:</strong> ${escapeHtml(article.category_name)}` : ''}</p>
    ${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}
    <div>${article.content || ''}</div>
  </article>
</body>
</html>`;
    return res.status(200).type('text/html').send(html);
  } catch (err) {
    console.error('[GET /seo-intelligence/meta-render]', err);
    return res.status(500).type('text/html').send('<html><body>Internal Error</body></html>');
  }
}

router.get('/meta-render', (req, res) => renderCrawlerMeta(req, res));
router.renderCrawlerMeta = renderCrawlerMeta;

// =========================================================================
// PROTECTED ADMIN / MARKETING SEO INTELLIGENCE ROUTES
// =========================================================================

router.use(requireAuth, requireAdminOrMarketing);

/**
 * POST /api/seo-intelligence/analyze - Deterministic SEO + Readability + GEO scoring
 */
router.post('/analyze', async (req, res) => {
  try {
    const payload = req.body || {};
    let articleData = payload;

    if (payload.article_id && !payload.title && !payload.content) {
      const rows = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [parseInt(payload.article_id, 10)]);
      if (!rows[0]) return res.status(404).json({ message: 'Artikel tidak ditemukan.' });
      articleData = rows[0];
    }

    const analysis = analyzeArticle(articleData);

    if (payload.save && payload.article_id) {
      await query(
        `UPDATE blog_articles
         SET seo_score = ?, readability_score = ?, geo_score = ?, seo_audit_json = ?, seo_audit_at = NOW()
         WHERE id = ?`,
        [
          analysis.seo_score,
          analysis.readability_score,
          analysis.geo_score,
          JSON.stringify(analysis),
          parseInt(payload.article_id, 10)
        ]
      );
    }

    res.json({ analysis });
  } catch (err) {
    console.error('[POST /seo-intelligence/analyze]', err);
    res.status(500).json({ message: 'Gagal menjalankan analisis SEO.' });
  }
});

/**
 * POST /api/seo-intelligence/bulk-analyze - Re-score all articles deterministically
 */
router.post('/bulk-analyze', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM blog_articles');
    let sumSeo = 0;
    let sumRead = 0;
    let sumGeo = 0;

    for (const art of rows) {
      const analysis = analyzeArticle(art);
      sumSeo += analysis.seo_score;
      sumRead += analysis.readability_score;
      sumGeo += analysis.geo_score;
      await query(
        `UPDATE blog_articles
         SET seo_score = ?, readability_score = ?, geo_score = ?, seo_audit_json = ?, seo_audit_at = NOW()
         WHERE id = ?`,
        [analysis.seo_score, analysis.readability_score, analysis.geo_score, JSON.stringify(analysis), art.id]
      );
    }

    const count = rows.length || 1;
    res.json({
      analyzed_count: rows.length,
      avg_seo_score: rows.length ? Math.round(sumSeo / count) : 0,
      avg_readability_score: rows.length ? Math.round(sumRead / count) : 0,
      avg_geo_score: rows.length ? Math.round(sumGeo / count) : 0
    });
  } catch (err) {
    console.error('[POST /seo-intelligence/bulk-analyze]', err);
    res.status(500).json({ message: 'Gagal menjalankan audit massal artikel.' });
  }
});

/**
 * POST /api/seo-intelligence/ai/audit - Gemini Deep SEO & GEO Audit
 */
router.post('/ai/audit', async (req, res) => {
  try {
    const article = req.body?.article || req.body || {};
    const deterministic = analyzeArticle(article);
    const result = await runAiSeoAudit(article, deterministic);
    res.json(result);
  } catch (err) {
    console.error('[POST /seo-intelligence/ai/audit]', err);
    res.status(500).json({ message: err.message || 'Gagal menjalankan Audit AI Gemini.' });
  }
});

/**
 * POST /api/seo-intelligence/ai/assist - Gemini Writing Assistant (titles, descriptions, intro, faq, headings, alt_text, internal_links, etc.)
 */
router.post('/ai/assist', async (req, res) => {
  try {
    const { task, article = {}, extraContext = '' } = req.body || {};
    if (!task) return res.status(400).json({ message: 'Parameter task wajib diisi.' });

    let existingArticles = [];
    if (task === 'internal_links') {
      existingArticles = await query(
        `SELECT id, title, slug, focus_keyphrase
         FROM blog_articles
         WHERE status IN ('published', 'scheduled', 'in_review') AND id != ?
         ORDER BY updated_at DESC LIMIT 30`,
        [parseInt(article.id, 10) || 0]
      );
    }

    const result = await runAiAssist({ task, article, existingArticles, extraContext });
    res.json(result);
  } catch (err) {
    console.error('[POST /seo-intelligence/ai/assist]', err);
    res.status(500).json({ message: err.message || 'Gagal memproses AI Writing Assistant.' });
  }
});

/**
 * POST /api/seo-intelligence/ai/optimize - Gemini One-Click Full SEO & GEO Optimization with Before/After Diff
 */
router.post('/ai/optimize', async (req, res) => {
  try {
    const article = req.body?.article || req.body || {};
    const existingArticles = await query(
      `SELECT id, title, slug, focus_keyphrase
       FROM blog_articles
       WHERE status = 'published' AND id != ?
       ORDER BY views DESC, updated_at DESC LIMIT 25`,
      [parseInt(article.id, 10) || 0]
    );

    const optimization = await runOneClickOptimize(article, existingArticles);

    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'AI_ONE_CLICK_SEO_PREVIEW',
      target: article.id ? `blog_article:${article.id}` : 'draft_editor',
      details: {
        before_seo: optimization.before.seo_score,
        after_seo: optimization.after.seo_score,
        before_geo: optimization.before.geo_score,
        after_geo: optimization.after.geo_score
      },
      ip: req.ip
    });

    res.json({ optimization });
  } catch (err) {
    console.error('[POST /seo-intelligence/ai/optimize]', err);
    res.status(500).json({ message: err.message || 'Gagal menjalankan Optimasi AI 1-Klik.' });
  }
});

// =========================================================================
// GOOGLE SEARCH CONSOLE (GSC) ROUTES
// =========================================================================

router.get('/gsc/settings', async (req, res) => {
  try {
    const settings = await gscService.getPublicSettings(req);
    res.json({ settings });
  } catch (err) {
    console.error('[GET /gsc/settings]', err);
    res.status(500).json({ message: 'Gagal mengambil konfigurasi Google Search Console.' });
  }
});

router.put('/gsc/settings', async (req, res) => {
  try {
    await gscService.saveCredentials(req.body || {});
    const settings = await gscService.getPublicSettings(req);
    res.json({ settings, message: 'Konfigurasi GSC berhasil disimpan.' });
  } catch (err) {
    console.error('[PUT /gsc/settings]', err);
    res.status(500).json({ message: 'Gagal menyimpan konfigurasi GSC.' });
  }
});

router.get('/gsc/auth-url', async (req, res) => {
  try {
    const data = await gscService.createAuthUrl(req);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/gsc/disconnect', async (req, res) => {
  try {
    await gscService.disconnectGsc();
    const settings = await gscService.getPublicSettings(req);
    res.json({ settings, message: 'Koneksi Google Search Console diputuskan.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memutuskan koneksi GSC.' });
  }
});

router.post('/gsc/sync', async (req, res) => {
  try {
    const result = await gscService.syncPerformanceData();
    const dashboard = await gscService.getPerformanceDashboard();
    res.json({ sync: result, performance: dashboard });
  } catch (err) {
    console.error('[POST /gsc/sync]', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.get('/gsc/performance', async (req, res) => {
  try {
    const dashboard = await gscService.getPerformanceDashboard();
    res.json({ performance: dashboard });
  } catch (err) {
    console.error('[GET /gsc/performance]', err);
    res.status(500).json({ message: 'Gagal membaca data performa Search Console.' });
  }
});

router.get('/gsc/sites', async (req, res) => {
  try {
    const result = await gscExtended.listVerifiedProperties();
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/gsc/inspect-url', async (req, res) => {
  try {
    const { article_id, inspection_url, site_url } = req.body || {};
    const result = await gscExtended.inspectArticleUrl({
      articleId: article_id || null,
      inspectionUrl: inspection_url || '',
      siteUrlOverride: site_url || null,
      userId: req.user?.id || null
    });
    res.json(result);
  } catch (err) {
    console.error('[POST /gsc/inspect-url]', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.get('/gsc/inspections', async (req, res) => {
  try {
    const articleId = req.query.article_id ? Number(req.query.article_id) : null;
    const limit = Math.min(100, Number(req.query.limit || 30));
    const inspections = await gscExtended.getInspectionHistory({ articleId, limit });
    res.json({ inspections });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat riwayat URL Inspection.' });
  }
});

router.post('/gsc/submit-sitemap', async (req, res) => {
  try {
    const { site_url } = req.body || {};
    let gscSitemap = null;
    try {
      gscSitemap = await gscExtended.submitSitemapToGsc(site_url || null);
    } catch (err) {
      gscSitemap = { submitted: false, error: err.message };
    }

    const recentArticles = await query(
      `SELECT slug FROM blog_articles
       WHERE status = 'published' AND COALESCE(visibility, 'public') = 'public'
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 40`
    );
    const urls = [
      `${PUBLIC_BASE_URL}/`,
      `${PUBLIC_BASE_URL}/blog`,
      ...recentArticles.map((a) => `${PUBLIC_BASE_URL}/blog/${a.slug}`)
    ];
    let indexNow = null;
    try {
      indexNow = await gscExtended.submitIndexNowUrls(urls);
    } catch (err) {
      indexNow = { submitted: false, error: err.message };
    }

    res.json({ gsc_sitemap: gscSitemap, indexnow: indexNow });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Gagal mengirim sitemap ke search engine.' });
  }
});

router.get('/performance/unified', async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit || 50));
    const data = await gscExtended.getUnifiedSeoPerformance({ limit });
    res.json(data);
  } catch (err) {
    console.error('[GET /performance/unified]', err);
    res.status(500).json({ message: 'Gagal memuat dashboard performa SEO terpadu.' });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await gscExtended.listImprovementSuggestions({
      status: req.query.status || '',
      articleId: req.query.article_id ? Number(req.query.article_id) : null,
      limit: Math.min(100, Number(req.query.limit || 30))
    });
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat daftar saran optimasi AI.' });
  }
});

router.post('/suggestions/generate', async (req, res) => {
  try {
    const { article_id, limit = 3 } = req.body || {};
    const result = await gscExtended.generateGscImprovementSuggestions({
      articleId: article_id || null,
      limit: Math.min(10, Number(limit || 3)),
      user: req.user
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/suggestions/:id/apply', async (req, res) => {
  try {
    const result = await gscExtended.applyImprovementSuggestion(Number(req.params.id), req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/suggestions/:id/dismiss', async (req, res) => {
  try {
    const result = await gscExtended.dismissImprovementSuggestion(Number(req.params.id), req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =========================================================================
// CONTENT STRATEGY: TOPIC CLUSTERS, IDEAS & INTERNAL LINK OPPORTUNITIES
// =========================================================================

router.get('/clusters', async (req, res) => {
  try {
    const clusters = await query(
      `SELECT tc.*,
              COUNT(a.id) AS article_count,
              SUM(CASE WHEN a.status = 'published' THEN 1 ELSE 0 END) AS published_count,
              ROUND(AVG(NULLIF(a.seo_score, 0)), 0) AS avg_seo_score
       FROM blog_topic_clusters tc
       LEFT JOIN blog_articles a ON a.cluster_id = tc.id
       GROUP BY tc.id
       ORDER BY tc.created_at DESC`
    );
    res.json({ clusters });
  } catch (err) {
    console.error('[GET /clusters]', err);
    res.status(500).json({ message: 'Gagal mengambil topic clusters.' });
  }
});

router.post('/clusters', async (req, res) => {
  try {
    const { name, pillar_title, pillar_slug, target_keyword, search_intent = 'informational', status = 'active', notes = '' } = req.body || {};
    if (!name || !pillar_title || !target_keyword) {
      return res.status(400).json({ message: 'Nama klaster, judul pilar, dan kata kunci target wajib diisi.' });
    }
    const result = await query(
      `INSERT INTO blog_topic_clusters (name, pillar_title, pillar_slug, target_keyword, search_intent, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [String(name).trim(), String(pillar_title).trim(), slugify(pillar_slug || pillar_title), String(target_keyword).trim(), search_intent, status, notes]
    );
    const [cluster] = await query('SELECT * FROM blog_topic_clusters WHERE id = ?', [result.insertId]);
    res.status(201).json({ cluster });
  } catch (err) {
    console.error('[POST /clusters]', err);
    res.status(500).json({ message: 'Gagal membuat topic cluster.' });
  }
});

router.put('/clusters/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, pillar_title, pillar_slug, target_keyword, search_intent, status, notes } = req.body || {};
    const rows = await query('SELECT * FROM blog_topic_clusters WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Klaster tidak ditemukan.' });
    const c = rows[0];

    await query(
      `UPDATE blog_topic_clusters
       SET name = ?, pillar_title = ?, pillar_slug = ?, target_keyword = ?, search_intent = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        name ?? c.name,
        pillar_title ?? c.pillar_title,
        pillar_slug !== undefined ? slugify(pillar_slug) : c.pillar_slug,
        target_keyword ?? c.target_keyword,
        search_intent ?? c.search_intent,
        status ?? c.status,
        notes !== undefined ? notes : c.notes,
        id
      ]
    );
    const [updated] = await query('SELECT * FROM blog_topic_clusters WHERE id = ?', [id]);
    res.json({ cluster: updated });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui topic cluster.' });
  }
});

router.delete('/clusters/:id', async (req, res) => {
  try {
    await query('DELETE FROM blog_topic_clusters WHERE id = ?', [parseInt(req.params.id, 10)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus topic cluster.' });
  }
});

router.get('/ideas', async (req, res) => {
  try {
    const ideas = await query(
      `SELECT i.*, tc.name AS cluster_name, a.slug AS linked_article_slug, a.status AS linked_article_status
       FROM blog_content_ideas i
       LEFT JOIN blog_topic_clusters tc ON tc.id = i.cluster_id
       LEFT JOIN blog_articles a ON a.id = i.linked_article_id
       ORDER BY FIELD(i.status, 'idea', 'planned', 'drafted', 'dismissed'), FIELD(i.priority, 'high', 'medium', 'low'), i.created_at DESC`
    );
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil daftar ide konten.' });
  }
});

router.post('/ideas', async (req, res) => {
  try {
    const { cluster_id = null, title, target_keyword = '', search_intent = 'informational', priority = 'medium', rationale = '', suggested_outline = [], source = 'manual' } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Judul ide konten wajib diisi.' });
    }
    const outlineJson = Array.isArray(suggested_outline) && suggested_outline.length > 0
      ? JSON.stringify(suggested_outline)
      : null;

    const result = await query(
      `INSERT INTO blog_content_ideas (cluster_id, title, target_keyword, search_intent, priority, rationale, suggested_outline_json, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cluster_id ? parseInt(cluster_id, 10) : null, String(title).trim(), target_keyword, search_intent, priority, rationale, outlineJson, source]
    );
    const [idea] = await query('SELECT * FROM blog_content_ideas WHERE id = ?', [result.insertId]);
    res.status(201).json({ idea });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan ide konten.' });
  }
});

router.post('/ideas/generate-ai', async (req, res) => {
  try {
    const { focus_topic = '' } = req.body || {};
    const [clusters, gscQueries, existingArticles] = await Promise.all([
      query('SELECT id, name, target_keyword FROM blog_topic_clusters'),
      query('SELECT query_text, clicks, impressions, position FROM blog_gsc_performance ORDER BY impressions DESC LIMIT 20'),
      query('SELECT title FROM blog_articles ORDER BY created_at DESC LIMIT 60')
    ]);

    const aiRes = await generateAiContentIdeas({
      clusters,
      gscQueries,
      existingTitles: existingArticles.map((a) => a.title),
      focusTopic: focus_topic
    });

    const createdIdeas = [];
    for (const item of aiRes.ideas) {
      if (!item || !item.title) continue;
      const validClusterId = clusters.some((c) => Number(c.id) === Number(item.cluster_id))
        ? Number(item.cluster_id)
        : null;
      const ins = await query(
        `INSERT INTO blog_content_ideas
         (cluster_id, title, target_keyword, search_intent, priority, rationale, suggested_outline_json, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ai_gap', 'idea')`,
        [
          validClusterId,
          String(item.title).trim().slice(0, 240),
          String(item.target_keyword || '').trim().slice(0, 175),
          ['informational', 'commercial', 'transactional', 'navigational'].includes(item.search_intent)
            ? item.search_intent
            : 'informational',
          ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
          item.rationale || null,
          Array.isArray(item.outline) ? JSON.stringify(item.outline) : null
        ]
      );
      const [row] = await query('SELECT * FROM blog_content_ideas WHERE id = ?', [ins.insertId]);
      if (row) createdIdeas.push(row);
    }

    res.json({ generated: createdIdeas, model: aiRes.model });
  } catch (err) {
    console.error('[POST /ideas/generate-ai]', err);
    res.status(500).json({ message: err.message || 'Gagal menghasilkan ide konten dengan Gemini.' });
  }
});

router.post('/ideas/:id/convert-to-draft', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const targetStatus = req.body?.status === 'ideas' ? 'ideas' : 'draft';
    const [ideaRows, catRows] = await Promise.all([
      query('SELECT * FROM blog_content_ideas WHERE id = ? LIMIT 1', [id]),
      query('SELECT id FROM blog_categories ORDER BY sort_order ASC LIMIT 1')
    ]);
    const idea = ideaRows[0];
    if (!idea) return res.status(404).json({ message: 'Ide konten tidak ditemukan.' });

    if (idea.linked_article_id) {
      const existing = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [idea.linked_article_id]);
      if (existing[0]) {
        return res.json({ article: existing[0], alreadyLinked: true });
      }
    }

    let outline = [];
    if (idea.suggested_outline_json) {
      try {
        outline = JSON.parse(idea.suggested_outline_json);
      } catch {
        outline = [];
      }
    }

    const htmlSkeleton = [
      `<p><strong>Ringkasan:</strong> ${escapeHtml(idea.rationale || `Panduan praktis mengenai ${idea.title} untuk kebutuhan bisnis digital bersama 1sLabs.`)}</p>`,
      ...(Array.isArray(outline) ? outline.map((h) => `<h2>${escapeHtml(String(h))}</h2>\n<p>Lengkapi pembahasan bagian ini dengan langkah konkret dan contoh kasus nyata.</p>`) : [])
    ].join('\n\n');

    let candidateSlug = slugify(idea.title);
    let c = 2;
    while ((await query('SELECT id FROM blog_articles WHERE slug = ? LIMIT 1', [candidateSlug])).length > 0) {
      candidateSlug = `${slugify(idea.title)}-${c++}`;
    }

    const analysis = analyzeArticle({
      title: idea.title,
      slug: candidateSlug,
      content: htmlSkeleton,
      focus_keyphrase: idea.target_keyword || '',
      author_name: req.user?.name || 'Tim Editorial 1sLabs'
    });

    const ins = await query(
      `INSERT INTO blog_articles
       (title, slug, excerpt, content, category_id, author_id, author_name, status, priority,
        focus_keyphrase, editorial_notes, cluster_id, reading_time, seo_score, readability_score, geo_score, seo_audit_json, seo_audit_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, ?, NOW())`,
      [
        idea.title,
        candidateSlug,
        idea.rationale ? String(idea.rationale).slice(0, 220) : '',
        htmlSkeleton,
        catRows[0]?.id || null,
        req.user?.id || null,
        req.user?.name || 'Tim Editorial 1sLabs',
        targetStatus,
        idea.priority || 'medium',
        idea.target_keyword || null,
        idea.rationale || null,
        idea.cluster_id || null,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        JSON.stringify(analysis)
      ]
    );

    await query(
      "UPDATE blog_content_ideas SET status = 'drafted', linked_article_id = ? WHERE id = ?",
      [ins.insertId, id]
    );

    const [createdArticle] = await query('SELECT * FROM blog_articles WHERE id = ?', [ins.insertId]);
    res.status(201).json({ article: createdArticle });
  } catch (err) {
    console.error('[POST /ideas/:id/convert-to-draft]', err);
    res.status(500).json({ message: 'Gagal mengonversi ide menjadi draft artikel.' });
  }
});

router.put('/ideas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, priority, title, target_keyword, rationale } = req.body || {};
    const rows = await query('SELECT * FROM blog_content_ideas WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Ide tidak ditemukan.' });
    const cur = rows[0];
    await query(
      `UPDATE blog_content_ideas SET status = ?, priority = ?, title = ?, target_keyword = ?, rationale = ? WHERE id = ?`,
      [status ?? cur.status, priority ?? cur.priority, title ?? cur.title, target_keyword ?? cur.target_keyword, rationale ?? cur.rationale, id]
    );
    const [updated] = await query('SELECT * FROM blog_content_ideas WHERE id = ?', [id]);
    res.json({ idea: updated });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui ide konten.' });
  }
});

router.delete('/ideas/:id', async (req, res) => {
  try {
    await query('DELETE FROM blog_content_ideas WHERE id = ?', [parseInt(req.params.id, 10)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus ide konten.' });
  }
});

/**
 * GET /api/seo-intelligence/internal-link-opportunities
 * Discover articles missing contextual links to published sibling/pillar articles.
 */
router.get('/internal-link-opportunities', async (req, res) => {
  try {
    const articles = await query(
      `SELECT id, title, slug, content, focus_keyphrase, status, cluster_id
       FROM blog_articles
       WHERE status IN ('published', 'draft', 'in_review', 'scheduled')
       ORDER BY updated_at DESC LIMIT 60`
    );

    const targets = articles.filter((a) => a.status === 'published' && a.slug);
    const opportunities = [];

    for (const src of articles) {
      const srcPlain = stripHtmlToText(src.content || '').toLowerCase();
      const srcHtml = String(src.content || '').toLowerCase();
      if (!srcPlain) continue;

      for (const tgt of targets) {
        if (tgt.id === src.id) continue;
        const targetPath = `/blog/${tgt.slug}`.toLowerCase();
        if (srcHtml.includes(targetPath)) continue; // already linked

        const kw = String(tgt.focus_keyphrase || '').trim().toLowerCase();
        const titleWords = String(tgt.title || '').toLowerCase().split(/\s+/).filter((w) => w.length >= 5);
        const matchesKeyword = kw.length >= 4 && srcPlain.includes(kw);
        const sameCluster = src.cluster_id && tgt.cluster_id && src.cluster_id === tgt.cluster_id;
        const sharedLongWords = titleWords.filter((w) => srcPlain.includes(w)).length;

        if (matchesKeyword || sameCluster || sharedLongWords >= 2) {
          opportunities.push({
            source_id: src.id,
            source_title: src.title,
            source_slug: src.slug,
            target_id: tgt.id,
            target_title: tgt.title,
            target_url: `/blog/${tgt.slug}`,
            suggested_anchor: tgt.focus_keyphrase || tgt.title,
            reason: matchesKeyword
              ? `Artikel sumber menyebut keyphrase "${tgt.focus_keyphrase}" tanpa link menuju artikel target.`
              : sameCluster
                ? 'Berada dalam Topic Cluster yang sama namun belum saling tertaut.'
                : 'Memiliki kesamaan topik utama di isi konten.'
          });
        }
        if (opportunities.length >= 30) break;
      }
      if (opportunities.length >= 30) break;
    }

    res.json({ opportunities });
  } catch (err) {
    console.error('[GET /internal-link-opportunities]', err);
    res.status(500).json({ message: 'Gagal menganalisis peluang internal link.' });
  }
});

// =========================================================================
// TECHNICAL SEO: REDIRECTS MANAGER (301/302)
// =========================================================================

router.get('/redirects', async (req, res) => {
  try {
    const redirects = await query('SELECT * FROM blog_seo_redirects ORDER BY created_at DESC');
    res.json({ redirects });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil daftar redirect.' });
  }
});

router.post('/redirects', async (req, res) => {
  try {
    const { source_path, target_url, status_code = 301, is_active = true, notes = '' } = req.body || {};
    if (!source_path || !target_url) {
      return res.status(400).json({ message: 'Source path dan Target URL wajib diisi.' });
    }
    const cleanSource = '/' + String(source_path).trim().replace(/^\/+/, '');
    const cleanTarget = String(target_url).trim();
    const code = Number(status_code) === 302 ? 302 : 301;

    const result = await query(
      `INSERT INTO blog_seo_redirects (source_path, target_url, status_code, is_active, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanSource, cleanTarget, code, is_active ? 1 : 0, notes || null]
    );
    const [created] = await query('SELECT * FROM blog_seo_redirects WHERE id = ?', [result.insertId]);
    res.status(201).json({ redirect: created });
  } catch (err) {
    res.status(400).json({ message: 'Gagal menambah redirect (pastikan source path belum terdaftar).' });
  }
});

router.put('/redirects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await query('SELECT * FROM blog_seo_redirects WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Redirect tidak ditemukan.' });
    const cur = rows[0];
    const b = req.body || {};

    await query(
      `UPDATE blog_seo_redirects
       SET source_path = ?, target_url = ?, status_code = ?, is_active = ?, notes = ?
       WHERE id = ?`,
      [
        b.source_path !== undefined ? '/' + String(b.source_path).trim().replace(/^\/+/, '') : cur.source_path,
        b.target_url !== undefined ? String(b.target_url).trim() : cur.target_url,
        b.status_code !== undefined ? (Number(b.status_code) === 302 ? 302 : 301) : cur.status_code,
        b.is_active !== undefined ? (b.is_active ? 1 : 0) : cur.is_active,
        b.notes !== undefined ? b.notes : cur.notes,
        id
      ]
    );
    const [updated] = await query('SELECT * FROM blog_seo_redirects WHERE id = ?', [id]);
    res.json({ redirect: updated });
  } catch (err) {
    res.status(400).json({ message: 'Gagal memperbarui aturan redirect.' });
  }
});

router.delete('/redirects/:id', async (req, res) => {
  try {
    await query('DELETE FROM blog_seo_redirects WHERE id = ?', [parseInt(req.params.id, 10)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus redirect.' });
  }
});

module.exports = router;

