const { query, withTransaction } = require('../../db');
const {
  ensureBlogSchema,
  sanitizeArticleHtml,
  applyJustifiedBodyAlignment,
  slugify,
  calculateReadingTime,
  syncArticleTags
} = require('../blog/blogSchema.service');
const { analyzeArticle } = require('../blog/seoAnalyzer.service');
const {
  getImagesForItemOrArticle,
  buildAttributionList,
  syncItemImagesToArticleStorage
} = require('./imageManager.service');
const { notifySearchEnginesOnPublish } = require('../blog/gscExtended.service');

const PUBLIC_BASE_URL = (process.env.PUBLIC_SITE_URL || 'https://1slabs.my.id').replace(/\/+$/, '');

function parseFaqArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((f) => f && f.question && f.answer)
      .map((f) => ({
        question: String(f.question).trim(),
        answer: String(f.answer).trim()
      }));
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseFaqArray(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

async function resolveCategoryId(pillarCode) {
  if (pillarCode) {
    const pillars = await query('SELECT category_slug FROM content_pillars WHERE code = ? LIMIT 1', [pillarCode]).catch(
      () => []
    );
    const catSlug = pillars[0]?.category_slug;
    if (catSlug) {
      const cats = await query('SELECT id FROM blog_categories WHERE slug = ? LIMIT 1', [catSlug]);
      if (cats.length > 0) return cats[0].id;
    }
  }
  const fallback = await query('SELECT id FROM blog_categories ORDER BY sort_order ASC, id ASC LIMIT 1');
  return fallback[0]?.id || null;
}

async function resolveClusterId(pillarCode, focusKeyphrase) {
  const clusters = await query('SELECT id, name, target_keyword FROM blog_topic_clusters');
  if (clusters.length === 0) return null;
  const kw = String(focusKeyphrase || '').toLowerCase();
  const matched = clusters.find(
    (c) =>
      (c.target_keyword && kw.includes(c.target_keyword.toLowerCase())) ||
      (pillarCode && c.name.toLowerCase().includes(pillarCode.replace(/-/g, ' ')))
  );
  return matched ? matched.id : null;
}

/**
 * Publishes or saves a generated article into 1sLabs canonical `blog_articles` table.
 * Handles idempotent updates (with revision snapshots) and prevents duplicate slug/title insertion.
 */
async function publishGeneratedItem(item, options = {}) {
  await ensureBlogSchema();

  const targetStatus = options.status === 'draft' ? 'draft' : 'published';
  const onDuplicate = options.onDuplicate || 'update';
  const editorId = options.user?.id || item.reviewed_by || null;
  const editorName = options.user?.name || options.user?.username || 'AI Content Automation 1sLabs';

  const title = String(item.draft_title || item.title || item.topic || '').trim().slice(0, 250);
  if (!title) {
    throw new Error('Artikel tidak memiliki judul untuk dipublikasikan.');
  }

  const rawContent = item.draft_content || item.content || '';
  const cleanHtml = applyJustifiedBodyAlignment(sanitizeArticleHtml(rawContent));
  if (!cleanHtml) {
    throw new Error('Konten HTML artikel kosong setelah sanitasi.');
  }

  const slug = slugify(item.draft_slug || item.slug || title);
  const focusKeyphrase = String(item.draft_focus_keyphrase || item.target_keyword || '').trim().slice(0, 180);
  const secondaryKeyphrases = String(item.draft_secondary_keyphrases || item.secondary_keywords || '').trim();
  const excerpt = String(item.draft_excerpt || item.draft_meta_description || '').trim();
  const metaTitle = String(item.draft_meta_title || title).trim().slice(0, 250);
  const metaDescription = String(item.draft_meta_description || excerpt).trim().slice(0, 320);
  const faqItems = parseFaqArray(item.draft_faq_json || item.faq_items);
  const faqJson = faqItems.length > 0 ? JSON.stringify(faqItems) : null;
  const readingTime = calculateReadingTime(cleanHtml);
  const canonicalUrl = `https://1slabs.my.id/blog/${slug}`;
  const authorName = 'Tim Engineer 1sLabs';
  const draftFeaturedImage = String(item.draft_featured_image || item.featured_image || '').trim() || null;
  const draftFeaturedAlt = String(item.featured_image_alt || '').trim().slice(0, 290) || null;
  const draftFeaturedCaption = String(item.draft_featured_image_caption || item.featured_image_caption || '').trim().slice(0, 480) || null;

  const itemImages = item.id ? await getImagesForItemOrArticle({ generationItemId: item.id }).catch(() => []) : [];
  const initialAttributions = buildAttributionList(itemImages);

  const analysis = analyzeArticle({
    title,
    slug,
    excerpt,
    content: cleanHtml,
    featured_image: draftFeaturedImage || '',
    featured_image_alt: draftFeaturedAlt || '',
    author_name: authorName,
    meta_title: metaTitle,
    meta_description: metaDescription,
    focus_keyphrase: focusKeyphrase,
    faq_items: faqItems
  });

  const categoryId = await resolveCategoryId(item.pillar_code);
  const clusterId = await resolveClusterId(item.pillar_code, focusKeyphrase);

  const result = await withTransaction(async (conn) => {
    let existing = null;
    const targetId = item.published_article_id || item.target_article_id || null;

    if (targetId) {
      const [rows] = await conn.query('SELECT * FROM blog_articles WHERE id = ? LIMIT 1', [targetId]);
      if (rows.length > 0) existing = rows[0];
    }

    if (!existing) {
      const [dups] = await conn.query(
        `SELECT * FROM blog_articles
         WHERE slug = ? OR LOWER(TRIM(title)) = LOWER(TRIM(?))
         LIMIT 1`,
        [slug, title]
      );
      if (dups.length > 0) existing = dups[0];
    }

    if (existing && onDuplicate === 'reject') {
      throw new Error(`Duplikasi terdeteksi: artikel '${existing.title}' (${existing.slug}) sudah ada di blog_articles.`);
    }

    const auditJson = JSON.stringify(analysis);
    const shouldPublishNow = targetStatus === 'published';

    if (existing) {
      const nextStatus = existing.status === 'published' || shouldPublishNow ? 'published' : targetStatus;
      const nextPublishedAt =
        nextStatus === 'published' ? existing.published_at || new Date() : existing.published_at || null;

      await conn.query(
        `UPDATE blog_articles
         SET title = ?, slug = ?, excerpt = ?, content = ?, category_id = ?, author_name = ?,
             featured_image = COALESCE(NULLIF(?, ''), featured_image),
             featured_image_alt = COALESCE(NULLIF(?, ''), featured_image_alt),
             featured_image_caption = COALESCE(NULLIF(?, ''), featured_image_caption),
             og_image = COALESCE(NULLIF(?, ''), og_image),
             image_attribution_json = COALESCE(?, image_attribution_json),
             status = ?, editorial_notes = ?, reading_time = ?,
             meta_title = ?, meta_description = ?, focus_keyphrase = ?, secondary_keyphrases = ?,
             canonical_url = ?, robots_directive = 'index,follow', og_title = ?, og_description = ?,
             schema_type = 'BlogPosting', faq_schema_json = ?,
             seo_score = ?, readability_score = ?, geo_score = ?, seo_audit_json = ?, seo_audit_at = NOW(),
             cluster_id = COALESCE(cluster_id, ?), published_at = ?
         WHERE id = ?`,
        [
          title,
          existing.slug || slug,
          excerpt,
          cleanHtml,
          categoryId || existing.category_id,
          existing.author_name || authorName,
          draftFeaturedImage || '',
          draftFeaturedAlt || '',
          draftFeaturedCaption || '',
          draftFeaturedImage || '',
          initialAttributions.length > 0 ? JSON.stringify(initialAttributions) : null,
          nextStatus,
          options.notes || `Diperbarui dari AI Content Automation (Item #${item.id || '-'})`,
          readingTime,
          metaTitle,
          metaDescription,
          focusKeyphrase,
          secondaryKeyphrases,
          existing.slug ? `https://1slabs.my.id/blog/${existing.slug}` : canonicalUrl,
          metaTitle,
          metaDescription,
          faqJson,
          analysis.seo_score,
          analysis.readability_score,
          analysis.geo_score,
          auditJson,
          clusterId,
          nextPublishedAt,
          existing.id
        ]
      );

      await conn.query(
        `INSERT INTO blog_article_revisions
         (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase, seo_score, readability_score, geo_score, change_summary)
         VALUES (?, ?, ?, 'ai_optimize', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          existing.id,
          editorId,
          editorName,
          title,
          excerpt,
          cleanHtml,
          metaTitle,
          metaDescription,
          focusKeyphrase,
          analysis.seo_score,
          analysis.readability_score,
          analysis.geo_score,
          options.notes || `Update artikel via AI Content Automation (${nextStatus})`
        ]
      );

      return {
        article_id: existing.id,
        slug: existing.slug || slug,
        status: nextStatus,
        action: 'updated'
      };
    }

    const [ins] = await conn.query(
      `INSERT INTO blog_articles
       (title, slug, excerpt, content, category_id, featured_image, featured_image_alt, featured_image_caption, og_image, image_attribution_json, author_id, author_name, status, priority, editorial_notes,
        is_featured, views, reading_time, meta_title, meta_description, focus_keyphrase, secondary_keyphrases,
        canonical_url, robots_directive, og_title, og_description, schema_type, faq_schema_json,
        seo_score, readability_score, geo_score, seo_audit_json, seo_audit_at, cluster_id, is_pillar, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'medium', ?, 0, 0, ?, ?, ?, ?, ?, ?, 'index,follow', ?, ?, 'BlogPosting', ?, ?, ?, ?, ?, NOW(), ?, 0, ?)`,
      [
        title,
        slug,
        excerpt,
        cleanHtml,
        categoryId,
        draftFeaturedImage,
        draftFeaturedAlt,
        draftFeaturedCaption,
        draftFeaturedImage,
        initialAttributions.length > 0 ? JSON.stringify(initialAttributions) : null,
        editorId,
        authorName,
        targetStatus,
        options.notes || `Diterbitkan dari AI Content Automation (Item #${item.id || '-'})`,
        readingTime,
        metaTitle,
        metaDescription,
        focusKeyphrase,
        secondaryKeyphrases,
        canonicalUrl,
        metaTitle,
        metaDescription,
        faqJson,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        auditJson,
        clusterId,
        shouldPublishNow ? new Date() : null
      ]
    );

    const newId = ins.insertId;
    await conn.query(
      `INSERT INTO blog_article_revisions
       (article_id, editor_id, editor_name, revision_type, title, excerpt, content, meta_title, meta_description, focus_keyphrase, seo_score, readability_score, geo_score, change_summary)
       VALUES (?, ?, ?, 'ai_optimize', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        editorId,
        editorName,
        title,
        excerpt,
        cleanHtml,
        metaTitle,
        metaDescription,
        focusKeyphrase,
        analysis.seo_score,
        analysis.readability_score,
        analysis.geo_score,
        `Artikel dibuat oleh AI Content Automation (${targetStatus})`
      ]
    );

    return {
      article_id: newId,
      slug,
      status: targetStatus,
      action: 'created'
    };
  });

  // Organize item images into `/uploads/articles/{article_id}/{featured|inline}/` & rewrite article URLs cleanly
  if (item.id && result.article_id) {
    const synced = await syncItemImagesToArticleStorage(item.id, result.article_id, {
      featuredImage: draftFeaturedImage,
      content: cleanHtml
    }).catch(() => null);

    if (synced) {
      await query(
        `UPDATE blog_articles
         SET featured_image = COALESCE(?, featured_image),
             og_image = COALESCE(?, og_image),
             content = ?,
             image_attribution_json = ?
         WHERE id = ?`,
        [
          synced.featuredImage,
          synced.featuredImage,
          synced.content || cleanHtml,
          synced.attributions?.length > 0 ? JSON.stringify(synced.attributions) : null,
          result.article_id
        ]
      );
    }
  }

  // Sync tags cleanly after transaction
  const rawTags = secondaryKeyphrases
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 40)
    .slice(0, 5);
  if (rawTags.length > 0) {
    await syncArticleTags(result.article_id, rawTags).catch(() => {});
  }

  if (result.status === 'published' && result.slug) {
    const publicUrl = `${PUBLIC_BASE_URL}/blog/${result.slug}`;
    notifySearchEnginesOnPublish([publicUrl]).catch(() => {});
  }

  return {
    ...result,
    analysis
  };
}

module.exports = {
  publishGeneratedItem
};
