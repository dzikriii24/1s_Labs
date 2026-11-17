const { query, withTransaction } = require('../../db');
const { ensureBlogSchema, sanitizeArticleHtml, calculateReadingTime } = require('./blogSchema.service');
const { ensureAutomationSchema } = require('../automation/automationSchema.service');
const { analyzeArticle } = require('./seoAnalyzer.service');
const { runOneClickOptimize } = require('./blogAi.service');
const {
  getValidAccessToken,
  buildPropertyCandidates,
  extractHost,
  hostsRelated,
  getPerformanceDashboard
} = require('./gsc.service');
const { logActivity } = require('../../utils/activityLogger');

const PUBLIC_BASE_URL = (process.env.PUBLIC_SITE_URL || 'https://1slabs.my.id').replace(/\/+$/, '');
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || '1slabs-indexnow-2026').trim();

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Lists verified Search Console properties accessible to the connected OAuth account.
 */
async function listVerifiedProperties() {
  await ensureAutomationSchema();
  const { accessToken, settings } = await getValidAccessToken();
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Gagal memuat daftar properti GSC (HTTP ${res.status}).`);
  }

  return {
    connected: true,
    active_site_url: settings.site_url || PUBLIC_BASE_URL,
    sites: (json.siteEntry || []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel
    }))
  };
}

/**
 * Calls Google's official URL Inspection API (`urlInspection/index:inspect`)
 * and stores inspection snapshots in `article_index_inspections`.
 * Does NOT fabricate or mimic unsupported Request Indexing endpoints.
 */
async function inspectArticleUrl({ articleId = null, inspectionUrl = '', siteUrlOverride = null, userId = null } = {}) {
  await ensureBlogSchema();
  await ensureAutomationSchema();

  let targetUrl = String(inspectionUrl || '').trim();
  let resolvedArticleId = articleId ? Number(articleId) : null;

  if (resolvedArticleId) {
    const rows = await query('SELECT id, slug, canonical_url, title FROM blog_articles WHERE id = ? LIMIT 1', [
      resolvedArticleId
    ]);
    if (rows.length === 0) throw new Error('Artikel tidak ditemukan.');
    if (!targetUrl) {
      targetUrl = rows[0].canonical_url || `${PUBLIC_BASE_URL}/blog/${rows[0].slug}`;
    }
  }

  if (targetUrl.startsWith('/')) {
    targetUrl = `${PUBLIC_BASE_URL}${targetUrl}`;
  } else if (targetUrl && !/^https?:\/\//i.test(targetUrl) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  if (!targetUrl || !/^https?:\/\/.+/i.test(targetUrl)) {
    throw new Error('URL inspeksi wajib menggunakan format http:// atau https:// yang valid.');
  }

  const { accessToken, settings } = await getValidAccessToken();
  const targetCandidates = buildPropertyCandidates(targetUrl);
  const overrideCandidates =
    siteUrlOverride && hostsRelated(siteUrlOverride, targetUrl) ? buildPropertyCandidates(siteUrlOverride) : [];
  const settingCandidates =
    settings.site_url && hostsRelated(settings.site_url, targetUrl) ? buildPropertyCandidates(settings.site_url) : [];
  const candidates = Array.from(new Set([...overrideCandidates, ...targetCandidates, ...settingCandidates]));

  const runInspectForProperty = async (siteCand) => {
    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inspectionUrl: targetUrl,
        siteUrl: siteCand,
        languageCode: 'id-ID'
      }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  let inspectedData = null;
  let usedSite = candidates[0] || PUBLIC_BASE_URL;
  let lastErr = null;
  const tried = new Set();

  for (const siteCand of candidates) {
    tried.add(siteCand);
    const { res, data } = await runInspectForProperty(siteCand);
    if (res.ok && data?.inspectionResult) {
      inspectedData = data.inspectionResult;
      usedSite = siteCand;
      break;
    }

    lastErr = data?.error?.message || `HTTP ${res.status}`;
    // Stop early on hard auth errors instead of hammering candidates
    if (res.status === 401) break;
  }

  // Fallback: check actual verified properties if direct domain candidates returned ownership error
  let verifiedOwnedList = null;
  if (!inspectedData && /do not own|not part of this property/i.test(String(lastErr || ''))) {
    try {
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000)
      });
      if (sitesRes.ok) {
        const sitesJson = await sitesRes.json().catch(() => ({}));
        const entries = (sitesJson.siteEntry || []).filter((s) => s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser');
        verifiedOwnedList = entries.map((s) => s.siteUrl);
        for (const s of entries) {
          if (tried.has(s.siteUrl) || !hostsRelated(s.siteUrl, targetUrl)) continue;
          tried.add(s.siteUrl);
          const { res, data } = await runInspectForProperty(s.siteUrl);
          if (res.ok && data?.inspectionResult) {
            inspectedData = data.inspectionResult;
            usedSite = s.siteUrl;
            break;
          }
          lastErr = data?.error?.message || `HTTP ${res.status}`;
        }
      }
    } catch {
      // Keep original error context if sites lookup cannot run (e.g., offline test)
    }
  }

  if (!inspectedData) {
    if (verifiedOwnedList && /do not own|not part of this property/i.test(String(lastErr || ''))) {
      const host = extractHost(targetUrl);
      const listText = verifiedOwnedList.length > 0 ? verifiedOwnedList.join(', ') : 'belum ada properti terverifikasi';
      throw new Error(
        `URL Inspection gagal: Domain "${host}" tidak tercakup di properti GSC akun ${
          settings.connected_email || 'terhubung'
        }. Properti terverifikasi yang tersedia: ${listText}.`
      );
    }
    throw new Error(`URL Inspection gagal: ${lastErr || 'Properti GSC tidak cocok atau akses ditolak.'}`);
  }

  const idxStatus = inspectedData.indexStatusResult || {};
  const insertRes = await query(
    `INSERT INTO article_index_inspections
     (article_id, inspection_url, site_url, verdict, coverage_state, indexing_state, robots_txt_state,
      page_fetch_state, google_canonical, user_canonical, last_crawl_time, crawled_as,
      sitemap_json, referring_urls_json, inspection_result_link, raw_result_json, inspected_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolvedArticleId,
      targetUrl,
      usedSite,
      idxStatus.verdict || 'VERDICT_UNSPECIFIED',
      idxStatus.coverageState || null,
      idxStatus.indexingState || null,
      idxStatus.robotsTxtState || null,
      idxStatus.pageFetchState || null,
      idxStatus.googleCanonical || null,
      idxStatus.userCanonical || null,
      idxStatus.lastCrawlTime || null,
      idxStatus.crawledAs || null,
      JSON.stringify(idxStatus.sitemap || []),
      JSON.stringify(idxStatus.referringUrls || []),
      inspectedData.inspectionResultLink || null,
      JSON.stringify(inspectedData),
      userId
    ]
  );

  const [saved] = await query('SELECT * FROM article_index_inspections WHERE id = ?', [insertRes.insertId]);
  return {
    inspection: saved,
    official_note:
      'Data diambil langsung via Google Search Console URL Inspection API. Permintaan pengindeksan manual ("Request Indexing") hanya tersedia melalui tombol resmi di Google Search Console UI (tautan inspection_result_link).'
  };
}

async function getInspectionHistory({ articleId = null, limit = 30 } = {}) {
  await ensureAutomationSchema();
  const whereSql = articleId ? 'WHERE i.article_id = ?' : '';
  const params = articleId ? [Number(articleId), Number(limit)] : [Number(limit)];
  const rows = await query(
    `SELECT i.*, b.title AS article_title, b.slug AS article_slug
     FROM article_index_inspections i
     LEFT JOIN blog_articles b ON i.article_id = b.id
     ${whereSql}
     ORDER BY i.id DESC
     LIMIT ?`,
    params
  );

  return rows.map((r) => ({
    ...r,
    sitemaps: safeJsonParse(r.sitemap_json, []),
    referring_urls: safeJsonParse(r.referring_urls_json, [])
  }));
}

/**
 * Joins internal SEO/GEO/readability metrics with Search Console page metrics and latest index inspection status.
 */
async function getUnifiedSeoPerformance({ limit = 50 } = {}) {
  await ensureBlogSchema();
  await ensureAutomationSchema();

  const [gscDashboard, articles, pageRows, latestInspections] = await Promise.all([
    getPerformanceDashboard().catch(() => ({ summary: {}, topQueries: [], topPages: [], opportunities: [], declining: [] })),
    query(
      `SELECT a.id, a.title, a.slug, a.status, a.focus_keyphrase, a.views,
              a.seo_score, a.readability_score, a.geo_score, a.published_at, a.updated_at,
              c.name AS category_name
       FROM blog_articles a
       LEFT JOIN blog_categories c ON a.category_id = c.id
       WHERE a.status IN ('published', 'draft', 'scheduled')
       ORDER BY a.published_at DESC, a.id DESC
       LIMIT ?`,
      [Number(limit)]
    ),
    query(
      `SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
              AVG(position) AS avg_position, MAX(date_range_end) AS last_date
       FROM blog_gsc_performance
       GROUP BY page_url`
    ).catch(() => []),
    query(
      `SELECT i1.*
       FROM article_index_inspections i1
       INNER JOIN (
         SELECT article_id, MAX(id) AS max_id
         FROM article_index_inspections
         WHERE article_id IS NOT NULL
         GROUP BY article_id
       ) i2 ON i1.id = i2.max_id`
    ).catch(() => [])
  ]);

  const gscBySlug = new Map();
  for (const row of pageRows) {
    const urlStr = String(row.page_url || '').trim();
    const match = urlStr.match(/\/(?:blog|artikel)\/([^/?#]+)/i);
    if (match && match[1]) {
      const slugKey = match[1].toLowerCase();
      const prev = gscBySlug.get(slugKey) || { clicks: 0, impressions: 0, posSum: 0, count: 0 };
      prev.clicks += Number(row.clicks || 0);
      prev.impressions += Number(row.impressions || 0);
      prev.posSum += Number(row.avg_position || 0);
      prev.count += 1;
      gscBySlug.set(slugKey, prev);
    }
  }

  const inspByArticle = new Map(latestInspections.map((r) => [Number(r.article_id), r]));

  const unifiedArticles = articles.map((a) => {
    const g = gscBySlug.get(String(a.slug || '').toLowerCase()) || null;
    const insp = inspByArticle.get(Number(a.id)) || null;
    const clicks = g ? g.clicks : 0;
    const impressions = g ? g.impressions : 0;
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const avgPosition = g && g.count > 0 ? Number((g.posSum / g.count).toFixed(1)) : null;
    const composite = Math.round((Number(a.seo_score || 0) + Number(a.readability_score || 0) + Number(a.geo_score || 0)) / 3);

    const needsOptimization =
      (impressions >= 20 && ctr < 3) ||
      (avgPosition !== null && avgPosition >= 5 && avgPosition <= 25) ||
      Number(a.seo_score || 0) < 75 ||
      Number(a.geo_score || 0) < 72;

    return {
      ...a,
      composite_score: composite,
      gsc: {
        clicks,
        impressions,
        ctr_percent: ctr,
        position: avgPosition
      },
      latest_inspection: insp
        ? {
            id: insp.id,
            verdict: insp.verdict,
            coverage_state: insp.coverage_state,
            last_crawl_time: insp.last_crawl_time,
            inspected_at: insp.inspected_at,
            inspection_result_link: insp.inspection_result_link
          }
        : null,
      needs_optimization: needsOptimization
    };
  });

  return {
    gsc_summary: gscDashboard.summary || {},
    top_queries: gscDashboard.topQueries || [],
    opportunities: gscDashboard.opportunities || [],
    declining: gscDashboard.declining || [],
    articles: unifiedArticles
  };
}

/**
 * Generates AI optimization suggestions from GSC & SEO signals.
 * Stores proposals in `content_optimization_suggestions` with `pending_approval`
 * so published articles are NEVER modified without explicit admin approval.
 */
async function generateGscImprovementSuggestions({ articleId = null, limit = 3, user = null } = {}) {
  await ensureBlogSchema();
  await ensureAutomationSchema();

  const perf = await getUnifiedSeoPerformance({ limit: 80 });
  let targets = perf.articles.filter((a) => a.status === 'published');
  if (articleId) {
    targets = targets.filter((a) => Number(a.id) === Number(articleId));
  } else {
    targets = targets
      .filter((a) => a.needs_optimization)
      .sort((a, b) => (b.gsc.impressions - a.gsc.impressions) || (a.composite_score - b.composite_score))
      .slice(0, Number(limit));
  }

  if (targets.length === 0) {
    return { generated: 0, suggestions: [] };
  }

  const existingArticles = await query('SELECT id, title, slug, focus_keyphrase FROM blog_articles ORDER BY id DESC LIMIT 40');
  const created = [];

  for (const t of targets) {
    const [fullArticle] = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [t.id]);
    if (!fullArticle) continue;

    const gscQueriesForPage = await query(
      `SELECT query_text, clicks, impressions, ctr, position
       FROM blog_gsc_performance
       WHERE page_url LIKE ?
       ORDER BY impressions DESC
       LIMIT 8`,
      [`%${fullArticle.slug}%`]
    ).catch(() => []);

    const opt = await runOneClickOptimize(
      {
        ...fullArticle,
        faq_items: safeJsonParse(fullArticle.faq_schema_json, [])
      },
      existingArticles
    );
    const prop = opt.proposed || {};

    const triggerMetrics = {
      before_seo: opt.before?.seo_score ?? fullArticle.seo_score,
      before_geo: opt.before?.geo_score ?? fullArticle.geo_score,
      before_readability: opt.before?.readability_score ?? fullArticle.readability_score,
      after_seo: opt.after?.seo_score ?? null,
      after_geo: opt.after?.geo_score ?? null,
      after_readability: opt.after?.readability_score ?? null,
      gsc_metrics: t.gsc,
      top_gsc_queries: gscQueriesForPage
    };

    const rationaleList = Array.isArray(opt.optimization_notes) ? opt.optimization_notes : [];
    const ins = await query(
      `INSERT INTO content_optimization_suggestions
       (article_id, source, trigger_metrics_json, proposed_title, proposed_meta_title,
        proposed_meta_description, proposed_focus_keyphrase, proposed_excerpt,
        proposed_content, proposed_faq_json, rationale, status, created_by)
       VALUES (?, 'gsc_performance', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
      [
        fullArticle.id,
        JSON.stringify(triggerMetrics),
        prop.title || fullArticle.title,
        prop.meta_title || fullArticle.meta_title,
        prop.meta_description || fullArticle.meta_description,
        prop.focus_keyphrase || fullArticle.focus_keyphrase,
        prop.excerpt || fullArticle.excerpt,
        prop.content || fullArticle.content,
        JSON.stringify(prop.faq_items || []),
        rationaleList.join(' | ') || 'Optimasi berbasis sinyal performa GSC dan audit SEO/GEO.',
        user?.id || null
      ]
    );

    const [saved] = await query('SELECT * FROM content_optimization_suggestions WHERE id = ?', [ins.insertId]);
    created.push(saved);
  }

  return { generated: created.length, suggestions: created };
}

async function listImprovementSuggestions({ status = '', articleId = null, limit = 30 } = {}) {
  await ensureAutomationSchema();
  const where = [];
  const params = [];
  if (status) {
    where.push('s.status = ?');
    params.push(status);
  }
  if (articleId) {
    where.push('s.article_id = ?');
    params.push(Number(articleId));
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT s.*, b.title AS current_title, b.slug AS article_slug, b.seo_score AS current_seo_score,
            b.geo_score AS current_geo_score, b.readability_score AS current_readability_score
     FROM content_optimization_suggestions s
     LEFT JOIN blog_articles b ON s.article_id = b.id
     ${whereSql}
     ORDER BY s.id DESC
     LIMIT ?`,
    [...params, Number(limit)]
  );
  return rows.map((r) => ({
    ...r,
    trigger_metrics: safeJsonParse(r.trigger_metrics_json, {}),
    proposed_faq: safeJsonParse(r.proposed_faq_json, [])
  }));
}

async function applyImprovementSuggestion(suggestionId, user = null) {
  await ensureBlogSchema();
  await ensureAutomationSchema();

  const [sug] = await query('SELECT * FROM content_optimization_suggestions WHERE id = ? LIMIT 1', [suggestionId]);
  if (!sug) throw new Error('Saran optimasi tidak ditemukan.');
  if (sug.status !== 'pending_approval') {
    throw new Error(`Saran ini sudah berstatus '${sug.status}'.`);
  }

  const [article] = await query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [sug.article_id]);
  if (!article) throw new Error('Artikel target tidak ditemukan.');

  const cleanContent = sanitizeArticleHtml(sug.proposed_content || article.content || '');
  const faqItems = safeJsonParse(sug.proposed_faq_json, []);
  const faqJson = faqItems.length > 0 ? JSON.stringify(faqItems) : article.faq_schema_json;

  const nextTitle = sug.proposed_title || article.title;
  const nextMetaTitle = sug.proposed_meta_title || article.meta_title;
  const nextMetaDesc = sug.proposed_meta_description || article.meta_description;
  const nextFocusKw = sug.proposed_focus_keyphrase || article.focus_keyphrase;
  const nextExcerpt = sug.proposed_excerpt || article.excerpt;

  const analysis = analyzeArticle({
    title: nextTitle,
    slug: article.slug,
    excerpt: nextExcerpt,
    content: cleanContent,
    featured_image: article.featured_image,
    featured_image_alt: article.featured_image_alt,
    author_name: article.author_name,
    meta_title: nextMetaTitle,
    meta_description: nextMetaDesc,
    focus_keyphrase: nextFocusKw,
    faq_items: faqItems
  });

  const revisionId = await withTransaction(async (conn) => {
    const [revIns] = await conn.query(
      `INSERT INTO blog_article_revisions
       (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase, seo_score, readability_score, geo_score, change_summary)
       VALUES (?, ?, ?, 'ai_optimize', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.id,
        user?.id || null,
        user?.name || user?.username || 'Admin 1sLabs',
        article.title,
        article.excerpt,
        article.content,
        article.meta_title,
        article.meta_description,
        article.focus_keyphrase,
        article.seo_score,
        article.readability_score,
        article.geo_score,
        `Snapshot sebelum menerapkan Saran Optimasi GSC #${suggestionId}`
      ]
    );

    await conn.query(
      `UPDATE blog_articles
       SET title = ?, meta_title = ?, meta_description = ?, focus_keyphrase = ?, excerpt = ?,
           content = ?, faq_schema_json = ?, reading_time = ?,
           seo_score = ?, readability_score = ?, geo_score = ?, seo_audit_json = ?, seo_audit_at = NOW()
       WHERE id = ?`,
      [
        nextTitle,
        nextMetaTitle,
        nextMetaDesc,
        nextFocusKw,
        nextExcerpt,
        cleanContent,
        faqJson,
        calculateReadingTime(cleanContent),
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        JSON.stringify(analysis),
        article.id
      ]
    );

    await conn.query(
      `UPDATE content_optimization_suggestions
       SET status = 'applied', reviewed_by = ?, applied_revision_id = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [user?.id || null, revIns.insertId, suggestionId]
    );

    return revIns.insertId;
  });

  await logActivity({
    actorId: user?.id,
    actorName: user?.name || user?.username,
    actorRole: user?.role,
    action: 'APPLY_GSC_OPTIMIZATION_SUGGESTION',
    target: `blog_article:${article.id}`,
    details: { suggestionId, revisionId, newScores: { seo: analysis.seo_score, geo: analysis.geo_score } },
    result: 'success'
  }).catch(() => {});

  return { applied: true, article_id: article.id, revision_id: revisionId, analysis };
}

async function dismissImprovementSuggestion(suggestionId, user = null) {
  await ensureAutomationSchema();
  await query(
    `UPDATE content_optimization_suggestions
     SET status = 'dismissed', reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [user?.id || null, suggestionId]
  );
  return { dismissed: true, id: suggestionId };
}

/**
 * Resubmits sitemap.xml to Google Search Console via official Webmasters API.
 */
async function submitSitemapToGsc(siteUrlOverride = null) {
  await ensureAutomationSchema();
  const { accessToken, settings } = await getValidAccessToken();
  const candidates = buildPropertyCandidates(siteUrlOverride || settings.site_url || PUBLIC_BASE_URL);
  const feedpath = `${PUBLIC_BASE_URL}/sitemap.xml`;

  let lastErr = null;
  for (const siteCand of candidates) {
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteCand
    )}/sitemaps/${encodeURIComponent(feedpath)}`;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok || res.status === 204) {
      return { submitted: true, siteUrl: siteCand, sitemapUrl: feedpath };
    }
    const errJson = await res.json().catch(() => ({}));
    lastErr = errJson?.error?.message || `HTTP ${res.status}`;
    if (res.status === 401 || /insufficient.*scope/i.test(lastErr)) break;
  }
  if (/insufficient.*scope/i.test(String(lastErr || ''))) {
    throw new Error(
      'Token OAuth GSC saat ini memakai scope read-only. Hubungkan ulang GSC di pengaturan untuk memberi izin submit sitemap (URL Inspection & IndexNow tetap berjalan).'
    );
  }
  throw new Error(`Submit Sitemap ke GSC gagal: ${lastErr || 'Akses ditolak'}`);
}

/**
 * Notifies Bing / DuckDuckGo / Yandex / Naver immediately via IndexNow protocol.
 */
async function submitIndexNowUrls(urls = []) {
  const cleanUrls = (urls || [])
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 100);
  if (cleanUrls.length === 0 || !INDEXNOW_KEY) {
    return { submitted: false, count: 0, reason: 'No valid URLs or IndexNow key' };
  }

  let host = '1slabs.my.id';
  try {
    host = new URL(PUBLIC_BASE_URL).hostname;
  } catch {}

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${PUBLIC_BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: cleanUrls
    }),
    signal: AbortSignal.timeout(12000)
  });

  return {
    submitted: res.ok || res.status === 202,
    status: res.status,
    count: cleanUrls.length,
    keyLocation: `${PUBLIC_BASE_URL}/${INDEXNOW_KEY}.txt`
  };
}

/**
 * Best-effort non-blocking notification to GSC Sitemap & IndexNow upon publishing.
 */
async function notifySearchEnginesOnPublish(urls = []) {
  if (process.env.NODE_ENV === 'test') return { skipped: true };
  const results = { gsc_sitemap: null, indexnow: null };
  try {
    results.gsc_sitemap = await submitSitemapToGsc();
  } catch (err) {
    results.gsc_sitemap = { submitted: false, error: err.message };
  }
  try {
    const targets = urls.length > 0 ? urls : [`${PUBLIC_BASE_URL}/blog`, `${PUBLIC_BASE_URL}/sitemap.xml`];
    results.indexnow = await submitIndexNowUrls(targets);
  } catch (err) {
    results.indexnow = { submitted: false, error: err.message };
  }
  return results;
}

module.exports = {
  listVerifiedProperties,
  inspectArticleUrl,
  getInspectionHistory,
  getUnifiedSeoPerformance,
  generateGscImprovementSuggestions,
  listImprovementSuggestions,
  applyImprovementSuggestion,
  dismissImprovementSuggestion,
  submitSitemapToGsc,
  submitIndexNowUrls,
  notifySearchEnginesOnPublish
};

