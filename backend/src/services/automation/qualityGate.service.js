const { query } = require('../../db');
const { analyzeArticle } = require('../blog/seoAnalyzer.service');
const { stripHtmlToText, slugify } = require('../blog/blogSchema.service');
const { FORBIDDEN_CLAIMS_RULES, VERIFIED_INTERNAL_PATHS } = require('../../data/companyKnowledgeBase');
const { doesLocalUploadExist } = require('./imageManager.service');

function normalizeTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function buildBigrams(tokens) {
  const res = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    res.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return res;
}

function computeSimilarity(aText, bText) {
  const aTokens = normalizeTokens(aText);
  const bTokens = normalizeTokens(bText);
  if (!aTokens.length || !bTokens.length) return 0;

  const setA = new Set([...aTokens, ...buildBigrams(aTokens)]);
  const setB = new Set([...bTokens, ...buildBigrams(bTokens)]);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Number((intersection / union).toFixed(3));
}

function isValidInternalLinkHref(href) {
  if (!href || typeof href !== 'string') return false;
  const trimmed = href.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed === '/' || trimmed.startsWith('/#')) return true;
  if (VERIFIED_INTERNAL_PATHS.includes(trimmed)) return true;
  if (/^\/blog\/[a-z0-9-]+$/i.test(trimmed)) return true;
  if (/^\/artikel\/[a-z0-9-]+$/i.test(trimmed)) return true;
  if (/^\/docs\/[a-z0-9-\/]+$/i.test(trimmed)) return true;
  if (/^\/hosting\/plan\/[a-z0-9-]+$/i.test(trimmed)) return true;
  return false;
}

function extractImageTags(html) {
  const imgs = [];
  const regex = /<img\b([^>]*)>/gi;
  let m;
  while ((m = regex.exec(html || '')) !== null) {
    const attrs = m[1] || '';
    const srcMatch = attrs.match(/\bsrc=(["'])(.*?)\1/i);
    const altMatch = attrs.match(/\balt=(["'])(.*?)\1/i);
    imgs.push({
      src: srcMatch ? srcMatch[2].trim() : '',
      alt: altMatch ? altMatch[2].trim() : ''
    });
  }
  return imgs;
}

async function checkDuplicateAndCannibalization({
  title,
  slug,
  focusKeyphrase,
  content,
  excludeArticleId = null,
  excludeItemId = null
}) {
  const articles = await query(
    `SELECT id, title, slug, focus_keyphrase, status, LEFT(content, 2000) AS content_preview
     FROM blog_articles`
  );

  const pendingItems = await query(
    `SELECT id, COALESCE(draft_title, topic) AS title, draft_slug AS slug,
            COALESCE(draft_focus_keyphrase, target_keyword) AS focus_keyphrase
     FROM content_generation_items
     WHERE status IN ('queued', 'researching', 'generating', 'auditing', 'awaiting_review', 'approved')`
  );

  const cleanSlug = slugify(slug || title);
  const normKeyphrase = String(focusKeyphrase || '').trim().toLowerCase();
  const sourceSig = `${title || ''} ${stripHtmlToText(content || '').slice(0, 1200)}`;

  let highestSimilarity = 0;
  let matchedArticleId = null;
  let matchedTitle = null;
  let exactSlugConflict = false;
  let keywordConflict = null;

  for (const row of articles) {
    if (excludeArticleId && Number(row.id) === Number(excludeArticleId)) continue;
    if (cleanSlug && row.slug && row.slug.toLowerCase() === cleanSlug) {
      exactSlugConflict = true;
      matchedArticleId = row.id;
      matchedTitle = row.title;
      highestSimilarity = Math.max(highestSimilarity, 0.95);
    }
    const rowKw = String(row.focus_keyphrase || '').trim().toLowerCase();
    if (normKeyphrase && rowKw && rowKw === normKeyphrase) {
      keywordConflict = { article_id: row.id, title: row.title, keyword: row.focus_keyphrase };
    }
    const targetSig = `${row.title || ''} ${stripHtmlToText(row.content_preview || '')}`;
    const sim = computeSimilarity(sourceSig, targetSig);
    if (sim > highestSimilarity) {
      highestSimilarity = sim;
      matchedArticleId = row.id;
      matchedTitle = row.title;
    }
  }

  for (const item of pendingItems) {
    if (excludeItemId && Number(item.id) === Number(excludeItemId)) continue;
    const itemSim = computeSimilarity(title || '', item.title || '');
    if (itemSim > highestSimilarity) {
      highestSimilarity = itemSim;
      matchedTitle = `[Antrean] ${item.title}`;
    }
    if (normKeyphrase && item.focus_keyphrase && item.focus_keyphrase.trim().toLowerCase() === normKeyphrase) {
      if (!keywordConflict) {
        keywordConflict = { item_id: item.id, title: `[Antrean] ${item.title}`, keyword: item.focus_keyphrase };
      }
    }
  }

  return {
    similarity_score: highestSimilarity,
    matched_article_id: matchedArticleId,
    matched_title: matchedTitle,
    exact_slug_conflict: exactSlugConflict,
    keyword_conflict: keywordConflict
  };
}

/**
 * Evaluates a candidate article using 1sLabs's unified `seoAnalyzer.service.js`,
 * factual/brand guardrails, internal link integrity, and Quality Gate thresholds.
 */
async function evaluateQualityGate(articlePayload, settings, options = {}) {
  const {
    excludeArticleId = null,
    excludeItemId = null,
    pillar = null
  } = options;

  const title = String(articlePayload.title || '').trim();
  const content = String(articlePayload.content || '').trim();
  const slug = slugify(articlePayload.slug || title);
  const focusKeyphrase = String(articlePayload.focus_keyphrase || '').trim();
  const faqItems = Array.isArray(articlePayload.faq_items) ? articlePayload.faq_items : [];

  const analysis = analyzeArticle({
    title,
    slug,
    excerpt: articlePayload.excerpt || '',
    content,
    featured_image: articlePayload.featured_image || '',
    featured_image_alt: articlePayload.featured_image_alt || '',
    author_name: articlePayload.author_name || 'Tim Engineer 1sLabs',
    meta_title: articlePayload.meta_title || title,
    meta_description: articlePayload.meta_description || articlePayload.excerpt || '',
    focus_keyphrase: focusKeyphrase,
    faq_items: faqItems
  });

  const duplicateCheck = await checkDuplicateAndCannibalization({
    title,
    slug,
    focusKeyphrase,
    content,
    excludeArticleId,
    excludeItemId
  });

  const hardFailures = [];
  const scoreFailures = [];
  const warnings = [];

  // 1. Non-empty title & content + minimum word count (no truncated drafts)
  if (!title || title.length < 15) {
    hardFailures.push({ code: 'title_invalid', message: 'Judul kosong atau terlalu pendek (< 15 karakter).' });
  }
  const minWords = Number(settings?.min_word_count || 650);
  if (!content || analysis.metrics.word_count < minWords) {
    hardFailures.push({
      code: 'content_too_short',
      message: `Panjang artikel ${analysis.metrics.word_count} kata masih di bawah batas minimum ${minWords} kata.`
    });
  }
  if (!slug || slug.length < 4) {
    hardFailures.push({ code: 'slug_invalid', message: 'Slug URL tidak valid atau kosong.' });
  }

  // 2. Truncated output guard (ends abruptly mid-sentence/tag)
  if (content && !/(<\/p>|<\/div>|<\/ul>|<\/ol>|<\/table>|<\/h[234]>)$/i.test(content.trim())) {
    warnings.push({ code: 'possible_truncation', message: 'Akhir HTML tidak ditutup dengan tag blok standar.' });
  }

  // 3. Heading hierarchy
  if (analysis.metrics.h1_in_body_count > 0) {
    hardFailures.push({
      code: 'body_h1_present',
      message: `Terdapat ${analysis.metrics.h1_in_body_count} tag <h1> di dalam isi artikel (harus hanya H2/H3).`
    });
  }
  if (analysis.metrics.h2_count < 2) {
    hardFailures.push({
      code: 'insufficient_h2',
      message: `Struktur heading H2 terlalu sedikit (${analysis.metrics.h2_count}; minimal 2).`
    });
  }

  // 4. Placeholder & forbidden claims check
  const combinedPlain = `${title}\n${articlePayload.meta_description || ''}\n${stripHtmlToText(content)}`;
  for (const rule of FORBIDDEN_CLAIMS_RULES) {
    const matched = rule.patterns.some((rx) => rx.test(combinedPlain));
    if (matched) {
      hardFailures.push({
        code: `forbidden_${rule.id}`,
        message: `Melanggar aturan fakta terverifikasi: ${rule.label} (${rule.reason})`
      });
    }
  }

  // 5. Broken links & internal link validation
  const internalLinks = analysis.links?.internal || [];
  const invalidLinks = internalLinks.filter((l) => !isValidInternalLinkHref(l.href));
  if (invalidLinks.length > 0) {
    warnings.push({
      code: 'unverified_internal_links',
      message: `Terdapat tautan internal yang belum terverifikasi di daftar route publik: ${invalidLinks.map((l) => l.href).join(', ')}`
    });
  }
  if (internalLinks.length === 0) {
    hardFailures.push({
      code: 'no_internal_links',
      message: 'Artikel wajib memiliki minimal 1 tautan internal ke halaman layanan, /docs, atau artikel 1sLabs.'
    });
  }
  if (/href=["']\s*(#|javascript:|undefined|null)\s*["']/i.test(content)) {
    hardFailures.push({
      code: 'broken_anchor_href',
      message: 'Ditemukan tautan rusak atau placeholder (# / javascript: / undefined).'
    });
  }

  // 6. Image Quality Gate & Attribution Validation
  const inlineImgs = extractImageTags(content);
  const featuredImg = String(articlePayload.featured_image || '').trim();
  const featuredAlt = String(articlePayload.featured_image_alt || '').trim();
  const imageRecords = Array.isArray(options.images) ? options.images : [];
  const imageValidationEnabled =
    options.enforceImageGate !== false &&
    Number(settings?.enable_auto_images ?? 1) === 1 &&
    Number(settings?.image_quality_validation ?? 1) === 1;

  const imageIssues = [];
  if (analysis.metrics.images_missing_alt_count > 0) {
    const msg = `${analysis.metrics.images_missing_alt_count} gambar di dalam konten belum memiliki atribut alt.`;
    hardFailures.push({ code: 'images_missing_alt', message: msg });
    imageIssues.push({ severity: 'hard', code: 'images_missing_alt', message: msg });
  }
  if (inlineImgs.some((i) => !i.src || /placeholder|undefined|null/i.test(i.src))) {
    const msg = 'Terdapat tag gambar tanpa sumber valid atau masih placeholder.';
    hardFailures.push({ code: 'invalid_image_src', message: msg });
    imageIssues.push({ severity: 'hard', code: 'invalid_image_src', message: msg });
  }

  // Verify local `/uploads/...` files actually exist on disk so broken paths never publish
  if (featuredImg && featuredImg.startsWith('/uploads/') && !doesLocalUploadExist(featuredImg)) {
    const msg = `File featured image lokal tidak ditemukan di storage (${featuredImg}).`;
    hardFailures.push({ code: 'broken_featured_image', message: msg });
    imageIssues.push({ severity: 'hard', code: 'broken_featured_image', message: msg });
  } else if (featuredImg && (/placeholder|undefined|null/i.test(featuredImg) || (!featuredImg.startsWith('/uploads/') && !/^https:\/\//i.test(featuredImg)))) {
    const msg = 'URL featured image tidak valid (harus local /uploads/... atau HTTPS).';
    hardFailures.push({ code: 'invalid_featured_image', message: msg });
    imageIssues.push({ severity: 'hard', code: 'invalid_featured_image', message: msg });
  }

  for (const inlineImg of inlineImgs) {
    if (inlineImg.src && inlineImg.src.startsWith('/uploads/') && !doesLocalUploadExist(inlineImg.src)) {
      const msg = `Gambar inline lokal tidak ditemukan di storage (${inlineImg.src}).`;
      hardFailures.push({ code: 'broken_inline_image', message: msg });
      imageIssues.push({ severity: 'hard', code: 'broken_inline_image', message: msg });
      break;
    }
  }

  // Detect duplicate image URLs used inside the same article
  const seenSrcs = new Set();
  if (featuredImg) seenSrcs.add(featuredImg.toLowerCase());
  const duplicateInline = inlineImgs.find((i) => i.src && seenSrcs.has(i.src.toLowerCase()));
  if (duplicateInline) {
    const msg = `Gambar duplikat terdeteksi dalam artikel yang sama (${duplicateInline.src}).`;
    warnings.push({ code: 'duplicate_article_image', message: msg });
    imageIssues.push({ severity: 'warning', code: 'duplicate_article_image', message: msg });
  }
  inlineImgs.forEach((i) => i.src && seenSrcs.add(i.src.toLowerCase()));

  if (featuredImg && (!featuredAlt || featuredAlt.length < 8)) {
    const msg = 'Featured image wajib memiliki alt text yang deskriptif.';
    hardFailures.push({ code: 'missing_featured_alt', message: msg });
    imageIssues.push({ severity: 'hard', code: 'missing_featured_alt', message: msg });
  }

  const imageGateBlockedAutoPublish = imageValidationEnabled && !featuredImg;
  if (imageGateBlockedAutoPublish) {
    const msg = 'Featured image belum tersedia; auto-publish ditahan dan artikel diarahkan ke antrean review visual.';
    warnings.push({ code: 'missing_featured_image', message: msg });
    imageIssues.push({ severity: 'auto_publish_block', code: 'missing_featured_image', message: msg });
  }

  const minInlineNeeded = Number(settings?.min_inline_images ?? 1);
  if (imageValidationEnabled && minInlineNeeded > 0 && analysis.metrics.h2_count >= 3 && inlineImgs.length < minInlineNeeded) {
    const msg = `Jumlah gambar pendukung inline (${inlineImgs.length}) di bawah target minimal (${minInlineNeeded}) untuk artikel ${analysis.metrics.h2_count} heading.`;
    warnings.push({ code: 'insufficient_inline_images', message: msg });
    imageIssues.push({ severity: 'warning', code: 'insufficient_inline_images', message: msg });
  }

  for (const rec of imageRecords) {
    if (rec.is_selected === 0 || rec.status === 'failed') continue;
    if (rec.width > 0 && rec.height > 0 && (rec.width < 480 || rec.height < 270)) {
      const msg = `Resolusi gambar ${rec.role} (${rec.width}x${rec.height}px) terlalu rendah.`;
      warnings.push({ code: 'low_image_resolution', message: msg });
      imageIssues.push({ severity: 'warning', code: 'low_image_resolution', message: msg });
    }
    if (Number(settings?.require_attribution ?? 1) === 1 && rec.attribution_required && !String(rec.attribution_text || '').trim()) {
      const msg = `Atribusi sumber/fotografer untuk gambar ${rec.role} (${rec.provider}) belum lengkap.`;
      warnings.push({ code: 'missing_image_attribution', message: msg });
      imageIssues.push({ severity: 'warning', code: 'missing_image_attribution', message: msg });
    }
  }

  const localImageCount = imageRecords.filter((r) => r.status === 'local' && r.is_selected !== 0).length;
  const externalFallbackCount = imageRecords.filter((r) => r.status === 'external_fallback' && r.is_selected !== 0).length;
  let imageScore = 100;
  imageIssues.forEach((iss) => {
    if (iss.severity === 'hard' || iss.severity === 'auto_publish_block') imageScore -= 35;
    else imageScore -= 12;
  });
  const imageQuality = {
    score: Math.max(0, imageScore),
    passed: !imageIssues.some((i) => i.severity === 'hard' || i.severity === 'auto_publish_block'),
    has_featured: Boolean(featuredImg),
    inline_count: inlineImgs.length,
    local_count: localImageCount,
    external_fallback_count: externalFallbackCount,
    issues: imageIssues
  };

  // 7. CTA & Service Alignment
  const hasCta =
    content.includes('oneslabs-cta-block') ||
    internalLinks.some((l) =>
      ['/schedule', '/hosting', '/portal?tab=freeplan', '/jasa-pembuatan-website', '/software-development', '/it-consulting', '/#contact'].includes(
        l.href
      )
    );
  if (!hasCta) {
    hardFailures.push({
      code: 'missing_service_cta',
      message: 'Artikel tidak memiliki CTA atau tautan ke halaman layanan / konsultasi 1sLabs yang relevan.'
    });
  } else if (pillar?.primary_cta_path && !internalLinks.some((l) => l.href === pillar.primary_cta_path)) {
    warnings.push({
      code: 'cta_pillar_mismatch',
      message: `Disarankan menyertakan tautan CTA utama pilar ke ${pillar.primary_cta_path}.`
    });
  }

  // 8. Duplication / Cannibalization
  const maxSim = Number(settings?.max_similarity_threshold || 0.72);
  if (duplicateCheck.exact_slug_conflict && !excludeArticleId) {
    hardFailures.push({
      code: 'duplicate_slug',
      message: `Slug '${slug}' sudah digunakan pada artikel '${duplicateCheck.matched_title}'.`
    });
  }
  if (duplicateCheck.similarity_score >= maxSim && !excludeArticleId) {
    hardFailures.push({
      code: 'excessive_similarity',
      message: `Kemiripan konten terlalu tinggi (${Math.round(duplicateCheck.similarity_score * 100)}%) terhadap '${duplicateCheck.matched_title}'.`
    });
  }
  if (duplicateCheck.keyword_conflict && !excludeArticleId) {
    warnings.push({
      code: 'keyword_cannibalization',
      message: `Focus keyphrase '${focusKeyphrase}' sudah ditargetkan oleh '${duplicateCheck.keyword_conflict.title}'.`
    });
  }

  // 9. Threshold Score Checks
  const minSeo = Number(settings?.min_seo_score || 75);
  const minRead = Number(settings?.min_readability_score || 68);
  const minGeo = Number(settings?.min_geo_score || 70);
  const minComp = Number(settings?.min_composite_score || 74);

  if (analysis.seo_score < minSeo) {
    scoreFailures.push({ code: 'seo_below_threshold', message: `SEO Score ${analysis.seo_score} < ambang minimal ${minSeo}.` });
  }
  if (analysis.readability_score < minRead) {
    scoreFailures.push({ code: 'readability_below_threshold', message: `Readability Score ${analysis.readability_score} < ambang minimal ${minRead}.` });
  }
  if (analysis.geo_score < minGeo) {
    scoreFailures.push({ code: 'geo_below_threshold', message: `GEO Score ${analysis.geo_score} < ambang minimal ${minGeo}.` });
  }
  if (analysis.composite_score < minComp) {
    scoreFailures.push({ code: 'composite_below_threshold', message: `Skor Gabungan ${analysis.composite_score} < ambang minimal ${minComp}.` });
  }

  const passed = hardFailures.length === 0 && scoreFailures.length === 0;

  return {
    passed,
    hard_failures: hardFailures,
    score_failures: scoreFailures,
    warnings,
    image_quality: imageQuality,
    image_gate_blocked_auto_publish: imageGateBlockedAutoPublish,
    analysis,
    duplicate_check: duplicateCheck,
    thresholds_used: { minSeo, minRead, minGeo, minComp, minWords, maxSim }
  };
}

module.exports = {
  evaluateQualityGate,
  checkDuplicateAndCannibalization,
  computeSimilarity
};

