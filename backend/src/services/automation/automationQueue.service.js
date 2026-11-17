const crypto = require('crypto');
const { query } = require('../../db');
const { ensureAutomationSchema } = require('./automationSchema.service');
const { sanitizeArticleHtml, applyJustifiedBodyAlignment, slugify } = require('../blog/blogSchema.service');
const { evaluateQualityGate, checkDuplicateAndCannibalization } = require('./qualityGate.service');
const {
  getKnowledgeSnapshot,
  getPillars,
  normalizePillarCodes,
  selectBalancedTopics,
  discoverTopicOpportunities
} = require('./contentStrategy.service');
const { generateArticle, sanitizeErrorMessage } = require('./generatorAdapter.service');
const { publishGeneratedItem } = require('./publication.service');
const {
  discoverAndAttachImagesForItem,
  getImagesForItemOrArticle,
  replaceItemImageSlot,
  insertInlineFiguresInHtml
} = require('./imageManager.service');
const { runOneClickOptimize } = require('../blog/blogAi.service');
const { logActivity } = require('../../utils/activityLogger');

let isWorkerRunning = false;
let hasPendingWork = false;

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function formatSettingsRow(row) {
  if (!row) return row;
  return {
    ...row,
    selected_pillars: normalizePillarCodes('', safeJsonParse(row.selected_pillars_json, [])),
    auto_optimize_below_threshold: row.auto_optimize_below_threshold !== undefined ? Boolean(row.auto_optimize_below_threshold) : true,
    max_auto_regenerations: Number(row.max_auto_regenerations ?? 1),
    enable_auto_images: row.enable_auto_images !== undefined ? Boolean(row.enable_auto_images) : true,
    image_primary_provider: row.image_primary_provider || 'auto',
    image_fallback_provider: row.image_fallback_provider || 'wikimedia',
    enable_ai_image_fallback: row.enable_ai_image_fallback !== undefined ? Boolean(row.enable_ai_image_fallback) : true,
    max_images_per_article: Number(row.max_images_per_article ?? 4),
    min_inline_images: Number(row.min_inline_images ?? 1),
    min_image_width: Number(row.min_image_width ?? 800),
    min_image_height: Number(row.min_image_height ?? 450),
    preferred_image_aspect: row.preferred_image_aspect || '16:9',
    preferred_image_format: row.preferred_image_format || 'webp',
    auto_download_images: row.auto_download_images !== undefined ? Boolean(row.auto_download_images) : true,
    auto_optimize_images: row.auto_optimize_images !== undefined ? Boolean(row.auto_optimize_images) : true,
    auto_image_alt_caption: row.auto_image_alt_caption !== undefined ? Boolean(row.auto_image_alt_caption) : true,
    require_attribution: row.require_attribution !== undefined ? Boolean(row.require_attribution) : true,
    inline_image_placement: row.inline_image_placement || 'after_h2_balanced',
    image_quality_validation: row.image_quality_validation !== undefined ? Boolean(row.image_quality_validation) : true
  };
}

async function getSettings() {
  await ensureAutomationSchema();
  const rows = await query('SELECT * FROM content_automation_settings WHERE id = 1 LIMIT 1');
  if (rows.length > 0) return formatSettingsRow(rows[0]);
  throw new Error('Pengaturan AI Content Automation belum tersedia.');
}

async function updateSettings(payload = {}) {
  await ensureAutomationSchema();
  const current = await getSettings();

  const allowedModes = ['manual_approval', 'auto_publish_qualified', 'always_save_draft'];
  const nextMode = allowedModes.includes(payload.approval_mode) ? payload.approval_mode : current.approval_mode;

  const clampInt = (val, min, max, fallback) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  };

  const nextSimilarity = Number.isFinite(Number(payload.max_similarity_threshold))
    ? Math.max(0.3, Math.min(0.95, Number(payload.max_similarity_threshold)))
    : Number(current.max_similarity_threshold);

  const nextEngineUrl =
    payload.engine_url && /^https?:\/\/(127\.0\.0\.1|localhost|[\w.-]+)(:\d+)?$/i.test(String(payload.engine_url).trim())
      ? String(payload.engine_url).trim().replace(/\/+$/, '')
      : current.engine_url;

  const nextSelectedPillars =
    payload.selected_pillars !== undefined
      ? normalizePillarCodes('', payload.selected_pillars)
      : current.selected_pillars || [];

  const allowedImgProviders = ['auto', 'unsplash', 'pexels', 'pixabay', 'openverse', 'wikimedia'];
  const allowedFallbackProviders = ['wikimedia', 'openverse', 'pexels', 'unsplash', 'pixabay', 'none'];
  const allowedFormats = ['webp', 'jpg', 'jpeg'];
  const allowedPlacements = ['after_h2_balanced', 'end_fallback'];
  const asFlag = (val, cur) => (val !== undefined ? (val ? 1 : 0) : cur ? 1 : 0);

  await query(
    `UPDATE content_automation_settings
     SET approval_mode = ?,
         engine_url = ?,
         default_language = ?,
         default_tone = ?,
         default_word_count = ?,
         min_seo_score = ?,
         min_readability_score = ?,
         min_geo_score = ?,
         min_composite_score = ?,
         min_word_count = ?,
         max_similarity_threshold = ?,
         daily_generation_limit = ?,
         max_batch_size = ?,
         auto_internal_linking = ?,
         auto_web_research = ?,
         auto_optimize_below_threshold = ?,
         max_auto_regenerations = ?,
         selected_pillars_json = ?,
         enable_auto_images = ?,
         image_primary_provider = ?,
         image_fallback_provider = ?,
         enable_ai_image_fallback = ?,
         max_images_per_article = ?,
         min_inline_images = ?,
         min_image_width = ?,
         min_image_height = ?,
         preferred_image_aspect = ?,
         preferred_image_format = ?,
         auto_download_images = ?,
         auto_optimize_images = ?,
         auto_image_alt_caption = ?,
         require_attribution = ?,
         inline_image_placement = ?,
         image_quality_validation = ?,
         timezone = ?
     WHERE id = 1`,
    [
      nextMode,
      nextEngineUrl,
      ['id', 'en'].includes(payload.default_language) ? payload.default_language : current.default_language,
      String(payload.default_tone || current.default_tone).slice(0, 80),
      clampInt(payload.default_word_count, 500, 3500, current.default_word_count),
      clampInt(payload.min_seo_score, 40, 98, current.min_seo_score),
      clampInt(payload.min_readability_score, 40, 98, current.min_readability_score),
      clampInt(payload.min_geo_score, 40, 98, current.min_geo_score),
      clampInt(payload.min_composite_score, 40, 98, current.min_composite_score),
      clampInt(payload.min_word_count, 300, 2000, current.min_word_count),
      nextSimilarity,
      clampInt(payload.daily_generation_limit, 1, 200, current.daily_generation_limit),
      clampInt(payload.max_batch_size, 1, 50, current.max_batch_size),
      asFlag(payload.auto_internal_linking, current.auto_internal_linking),
      asFlag(payload.auto_web_research, current.auto_web_research),
      asFlag(payload.auto_optimize_below_threshold, current.auto_optimize_below_threshold),
      clampInt(payload.max_auto_regenerations, 0, 2, current.max_auto_regenerations ?? 1),
      JSON.stringify(nextSelectedPillars),
      asFlag(payload.enable_auto_images, current.enable_auto_images),
      allowedImgProviders.includes(payload.image_primary_provider)
        ? payload.image_primary_provider
        : current.image_primary_provider || 'auto',
      allowedFallbackProviders.includes(payload.image_fallback_provider)
        ? payload.image_fallback_provider
        : current.image_fallback_provider || 'wikimedia',
      asFlag(payload.enable_ai_image_fallback, current.enable_ai_image_fallback),
      clampInt(payload.max_images_per_article, 1, 6, current.max_images_per_article ?? 4),
      clampInt(payload.min_inline_images, 0, 4, current.min_inline_images ?? 1),
      clampInt(payload.min_image_width, 400, 1920, current.min_image_width ?? 800),
      clampInt(payload.min_image_height, 240, 1200, current.min_image_height ?? 450),
      String(payload.preferred_image_aspect || current.preferred_image_aspect || '16:9').slice(0, 20),
      allowedFormats.includes(payload.preferred_image_format)
        ? payload.preferred_image_format
        : current.preferred_image_format || 'webp',
      asFlag(payload.auto_download_images, current.auto_download_images),
      asFlag(payload.auto_optimize_images, current.auto_optimize_images),
      asFlag(payload.auto_image_alt_caption, current.auto_image_alt_caption),
      asFlag(payload.require_attribution, current.require_attribution),
      allowedPlacements.includes(payload.inline_image_placement)
        ? payload.inline_image_placement
        : current.inline_image_placement || 'after_h2_balanced',
      asFlag(payload.image_quality_validation, current.image_quality_validation),
      String(payload.timezone || current.timezone || 'Asia/Jakarta').slice(0, 64)
    ]
  );

  return getSettings();
}

async function getDailyGeneratedCount() {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM content_generation_items
     WHERE DATE(created_at) = CURDATE()
       AND status NOT IN ('cancelled')`
  );
  return Number(rows[0]?.total || 0);
}

async function getQueueOverview() {
  await ensureAutomationSchema();
  const settings = await getSettings();
  const dailyUsed = await getDailyGeneratedCount();

  const [itemStats] = await query(`
    SELECT
      SUM(CASE WHEN status IN ('queued','researching','generating','auditing') THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN status = 'awaiting_review' THEN 1 ELSE 0 END) AS awaiting_review_count,
      SUM(CASE WHEN status IN ('published','approved') THEN 1 ELSE 0 END) AS published_count,
      SUM(CASE WHEN status = 'saved_draft' THEN 1 ELSE 0 END) AS saved_draft_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
      COUNT(*) AS total_items,
      ROUND(AVG(NULLIF(seo_score, 0)), 1) AS avg_seo_score,
      ROUND(AVG(NULLIF(geo_score, 0)), 1) AS avg_geo_score,
      ROUND(AVG(NULLIF(composite_score, 0)), 1) AS avg_composite_score
    FROM content_generation_items
  `);

  const [schedStats] = await query(`
    SELECT
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_schedules,
      COUNT(*) AS total_schedules
    FROM content_automation_schedules
  `);

  const [blogStats] = await query(`
    SELECT
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS total_blog_published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS total_blog_draft
    FROM blog_articles
  `);

  const [pendingSuggestions] = await query(
    `SELECT COUNT(*) AS total FROM content_optimization_suggestions WHERE status = 'pending_approval'`
  );

  const [nextSched] = await query(
    `SELECT id, job_code, name, cron_expression, next_run_at, last_run_at, last_run_status
     FROM content_automation_schedules
     WHERE is_active = 1
     ORDER BY COALESCE(next_run_at, '9999-12-31 23:59:59') ASC, id ASC
     LIMIT 1`
  ).catch(() => []);

  return {
    settings,
    quota: {
      daily_used: dailyUsed,
      daily_limit: settings.daily_generation_limit,
      remaining: Math.max(0, settings.daily_generation_limit - dailyUsed)
    },
    counts: {
      active_queue: Number(itemStats?.active_count || 0),
      awaiting_review: Number(itemStats?.awaiting_review_count || 0),
      published_via_automation: Number(itemStats?.published_count || 0),
      saved_draft: Number(itemStats?.saved_draft_count || 0),
      rejected: Number(itemStats?.rejected_count || 0),
      failed: Number(itemStats?.failed_count || 0),
      total_items: Number(itemStats?.total_items || 0),
      active_schedules: Number(schedStats?.active_schedules || 0),
      total_schedules: Number(schedStats?.total_schedules || 0),
      total_blog_published: Number(blogStats?.total_blog_published || 0),
      total_blog_draft: Number(blogStats?.total_blog_draft || 0),
      pending_seo_suggestions: Number(pendingSuggestions?.total || 0)
    },
    averages: {
      seo_score: Number(itemStats?.avg_seo_score || 0),
      geo_score: Number(itemStats?.avg_geo_score || 0),
      composite_score: Number(itemStats?.avg_composite_score || 0)
    },
    next_scheduled_run: nextSched || null
  };
}

async function enqueueManualJob(input = {}, user = null, options = {}) {
  await ensureAutomationSchema();
  const settings = await getSettings();
  const topic = String(input.topic || '').trim();
  if (topic.length < 3) {
    throw new Error('Topik artikel wajib diisi minimal 3 karakter.');
  }

  const dailyUsed = await getDailyGeneratedCount();
  if (dailyUsed + 1 > settings.daily_generation_limit) {
    throw new Error(`Batas harian generasi (${settings.daily_generation_limit} artikel/hari) telah tercapai.`);
  }

  const jobUuid = crypto.randomUUID();
  const approvalMode = ['manual_approval', 'auto_publish_qualified', 'always_save_draft'].includes(input.approval_mode)
    ? input.approval_mode
    : settings.approval_mode;

  const jobIns = await query(
    `INSERT INTO content_generation_jobs
     (job_uuid, job_type, title, pillar_code, approval_mode, status, total_items, created_by, created_by_name)
     VALUES (?, 'manual', ?, ?, ?, 'queued', 1, ?, ?)`,
    [
      jobUuid,
      topic.slice(0, 240),
      input.pillar_code || null,
      approvalMode,
      user?.id || null,
      user?.name || user?.username || 'Admin 1sLabs'
    ]
  );

  const jobId = jobIns.insertId;
  const targetKw = String(input.target_keyword || topic).trim().slice(0, 180);
  const secondaryKw = Array.isArray(input.secondary_keywords)
    ? input.secondary_keywords.join(', ')
    : String(input.secondary_keywords || '');

  const itemIns = await query(
    `INSERT INTO content_generation_items
     (job_id, topic, target_keyword, secondary_keywords, pillar_code, search_intent, language,
      word_count_target, enable_web_research, custom_instructions, target_article_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
    [
      jobId,
      topic.slice(0, 290),
      targetKw,
      secondaryKw,
      input.pillar_code || null,
      ['informational', 'commercial', 'transactional', 'navigational'].includes(input.search_intent)
        ? input.search_intent
        : 'commercial',
      ['id', 'en'].includes(input.language) ? input.language : settings.default_language,
      Math.max(500, Math.min(3500, Number(input.word_count_target || settings.default_word_count))),
      input.enable_web_research !== undefined ? (input.enable_web_research ? 1 : 0) : settings.auto_web_research,
      input.custom_instructions || null,
      input.target_article_id || null
    ]
  );

  const [job] = await query('SELECT * FROM content_generation_jobs WHERE id = ?', [jobId]);
  const [item] = await query('SELECT * FROM content_generation_items WHERE id = ?', [itemIns.insertId]);

  if (!options.deferProcessing) {
    setImmediate(() => {
      triggerQueueWorker().catch((err) => {
        console.error('[AutomationWorker] Error triggering manual worker:', sanitizeErrorMessage(err.message));
      });
    });
  }

  return { job, item };
}

async function enqueueBatchJob(input = {}, user = null, options = {}) {
  await ensureAutomationSchema();
  const settings = await getSettings();

  const rawTopics = Array.isArray(input.topics) ? input.topics : [];
  const normalized = [];
  const seen = new Set();
  for (const t of rawTopics) {
    const topicStr = typeof t === 'string' ? t.trim() : String(t?.topic || t?.title || '').trim();
    if (topicStr.length < 3) continue;
    const key = topicStr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      topic: topicStr.slice(0, 290),
      target_keyword: (typeof t === 'object' && t.target_keyword ? String(t.target_keyword) : topicStr).trim().slice(0, 180),
      secondary_keywords:
        typeof t === 'object' && Array.isArray(t.secondary_keywords)
          ? t.secondary_keywords.join(', ')
          : typeof t === 'object' && t.secondary_keywords
            ? String(t.secondary_keywords)
            : '',
      pillar_code: (typeof t === 'object' && t.pillar_code) || input.pillar_code || null,
      search_intent: (typeof t === 'object' && t.search_intent) || input.search_intent || 'commercial',
      custom_instructions: (typeof t === 'object' && t.custom_instructions) || input.custom_instructions || null
    });
  }

  if (normalized.length === 0) {
    throw new Error('Batch minimal harus berisi 1 topik valid.');
  }

  if (!options.bypassBatchLimit && normalized.length > settings.max_batch_size) {
    throw new Error(`Jumlah topik (${normalized.length}) melebihi batas maksimal batch (${settings.max_batch_size}).`);
  }

  const dailyUsed = await getDailyGeneratedCount();
  if (!options.bypassDailyQuota && dailyUsed + normalized.length > settings.daily_generation_limit) {
    throw new Error(
      `Kuota harian tidak mencukupi: terpakai ${dailyUsed}/${settings.daily_generation_limit}, diminta ${normalized.length}.`
    );
  }

  const jobUuid = crypto.randomUUID();
  const jobType = ['manual', 'batch', 'scheduled', 'autonomous'].includes(input.job_type) ? input.job_type : 'batch';
  const approvalMode = ['manual_approval', 'auto_publish_qualified', 'always_save_draft'].includes(input.approval_mode)
    ? input.approval_mode
    : settings.approval_mode;
  const pillarCodes = normalizePillarCodes(
    input.pillar_code || '',
    normalized.map((i) => i.pillar_code).concat(Array.isArray(input.pillar_codes) ? input.pillar_codes : [])
  );

  const jobIns = await query(
    `INSERT INTO content_generation_jobs
     (job_uuid, job_type, schedule_id, title, pillar_code, pillar_codes_json, approval_mode, status, total_items, created_by, created_by_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
    [
      jobUuid,
      jobType,
      input.schedule_id || null,
      String(input.title || `Batch ${normalized.length} Artikel (${jobType})`).slice(0, 240),
      input.pillar_code || pillarCodes[0] || null,
      JSON.stringify(pillarCodes),
      approvalMode,
      normalized.length,
      user?.id || null,
      user?.name || user?.username || (jobType === 'scheduled' ? 'Automation Scheduler' : 'Admin 1sLabs')
    ]
  );

  const jobId = jobIns.insertId;
  for (const item of normalized) {
    await query(
      `INSERT INTO content_generation_items
       (job_id, topic, target_keyword, secondary_keywords, pillar_code, search_intent, language,
        word_count_target, enable_web_research, custom_instructions, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
      [
        jobId,
        item.topic,
        item.target_keyword,
        item.secondary_keywords,
        item.pillar_code,
        ['informational', 'commercial', 'transactional', 'navigational'].includes(item.search_intent)
          ? item.search_intent
          : 'commercial',
        ['id', 'en'].includes(input.language) ? input.language : settings.default_language,
        Math.max(500, Math.min(3500, Number(input.word_count_target || settings.default_word_count))),
        input.enable_web_research !== undefined ? (input.enable_web_research ? 1 : 0) : settings.auto_web_research,
        item.custom_instructions
      ]
    );
  }

  const [job] = await query('SELECT * FROM content_generation_jobs WHERE id = ?', [jobId]);
  const items = await query('SELECT * FROM content_generation_items WHERE job_id = ? ORDER BY id ASC', [jobId]);

  if (!options.deferProcessing) {
    setImmediate(() => {
      triggerQueueWorker().catch((err) => {
        console.error('[AutomationWorker] Error triggering batch worker:', sanitizeErrorMessage(err.message));
      });
    });
  }

  return { job, items };
}

/**
 * One-click fully autonomous automation runner:
 * Takes selected content pillar(s) + count + policy and lets AI autonomously research,
 * filter duplicates/cannibalization, balance across pillars, and queue for generation.
 */
async function enqueueAutonomousJob(input = {}, user = null, options = {}) {
  await ensureAutomationSchema();
  const settings = await getSettings();
  const allActivePillars = await getPillars({ includeInactive: false });
  const activeMap = new Map(allActivePillars.map((p) => [p.code, p]));

  let targetCodes = normalizePillarCodes(input.pillar_code || '', input.pillar_codes).filter((c) => activeMap.has(c));
  if (targetCodes.length === 0 && Array.isArray(settings.selected_pillars) && settings.selected_pillars.length > 0) {
    targetCodes = settings.selected_pillars.filter((c) => activeMap.has(c));
  }
  if (targetCodes.length === 0) {
    targetCodes = allActivePillars.map((p) => p.code);
  }
  if (targetCodes.length === 0) {
    throw new Error('Tidak ada Content Pillar aktif yang tersedia untuk dijalankan.');
  }

  if (input.save_pillar_selection) {
    await updateSettings({ selected_pillars: targetCodes });
  }

  const maxBatch = Math.max(1, Number(settings.max_batch_size || 10));
  const requestedCount = Math.max(1, Number(input.article_count || input.count || 3));
  if (!options.bypassBatchLimit && requestedCount > maxBatch) {
    throw new Error(`Jumlah artikel (${requestedCount}) melebihi batas maksimal batch (${maxBatch}).`);
  }

  const dailyUsed = await getDailyGeneratedCount();
  const remainingQuota = Math.max(0, Number(settings.daily_generation_limit || 20) - dailyUsed);
  if (!options.bypassDailyQuota && requestedCount > remainingQuota) {
    throw new Error(
      `Kuota harian tidak mencukupi: terpakai ${dailyUsed}/${settings.daily_generation_limit}, tersisa ${remainingQuota}, diminta ${requestedCount}.`
    );
  }

  const discovery = await discoverTopicOpportunities({
    pillarCodes: targetCodes,
    count: Math.min(30, Math.max(requestedCount * 3, targetCodes.length * 2)),
    useAi: input.use_ai !== false,
    saveToIdeas: false
  });

  const recentQueueItems = await query(
    `SELECT topic, draft_title FROM content_generation_items
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND status NOT IN ('cancelled', 'failed')`
  );
  const recentTitles = new Set(
    recentQueueItems.flatMap((r) => [r.topic, r.draft_title]).filter(Boolean).map((s) => s.toLowerCase().trim())
  );

  const nonDupCandidates = [];
  for (const cand of discovery.candidates || []) {
    const titleKey = String(cand.title || '').toLowerCase().trim();
    if (!titleKey || recentTitles.has(titleKey)) continue;
    const dup = await checkDuplicateAndCannibalization({
      title: cand.title,
      slug: cand.title,
      focusKeyphrase: cand.target_keyword,
      content: `${cand.title} ${cand.rationale || ''}`
    });
    if (dup.exact_slug_conflict || dup.similarity_score >= Number(settings.max_similarity_threshold || 0.72)) continue;
    recentTitles.add(titleKey);
    nonDupCandidates.push(cand);
  }

  const picked = selectBalancedTopics(nonDupCandidates, targetCodes, requestedCount, false);
  if (picked.length === 0) {
    throw new Error('AI tidak menemukan topik baru non-duplikat pada Content Pillar yang dipilih. Coba pilih pilar tambahan atau perbarui daftar artikel.');
  }

  const pillarLabelList = targetCodes.map((c) => activeMap.get(c)?.name || c).slice(0, 3).join(', ');
  const extraCount = targetCodes.length > 3 ? ` +${targetCodes.length - 3}` : '';
  const jobTitle = String(
    input.title || `Autonomous Run (${pillarLabelList}${extraCount}) - ${picked.length} Artikel`
  ).slice(0, 240);

  const topicsPayload = picked.map((t) => ({
    topic: t.title,
    target_keyword: t.target_keyword || t.title,
    secondary_keywords: Array.isArray(t.secondary_keywords) ? t.secondary_keywords.join(', ') : '',
    pillar_code: t.pillar_code || targetCodes[0],
    search_intent: t.search_intent || activeMap.get(t.pillar_code)?.default_intent || 'commercial',
    custom_instructions: input.custom_instructions || null
  }));

  const batchResult = await enqueueBatchJob(
    {
      title: jobTitle,
      topics: topicsPayload,
      pillar_code: targetCodes[0] || null,
      pillar_codes: targetCodes,
      job_type: 'autonomous',
      approval_mode: input.approval_mode,
      language: input.language,
      word_count_target: input.word_count_target,
      enable_web_research: input.enable_web_research,
      custom_instructions: input.custom_instructions
    },
    user,
    options
  );

  return {
    ...batchResult,
    selected_pillars: targetCodes,
    discovery_source: discovery.source
  };
}

async function queueCalendarItem(calendarId, user = null, options = {}) {
  await ensureAutomationSchema();
  const rows = await query('SELECT * FROM content_calendar_items WHERE id = ? LIMIT 1', [Number(calendarId)]);
  if (rows.length === 0) throw new Error('Slot kalender tidak ditemukan.');
  const slot = rows[0];
  if (slot.status === 'queued' && slot.item_id) {
    throw new Error('Slot kalender ini sudah masuk ke antrean generasi.');
  }

  const res = await enqueueBatchJob(
    {
      title: `Calendar (${slot.scheduled_date}): ${slot.title}`,
      topics: [
        {
          topic: slot.title,
          target_keyword: slot.target_keyword || slot.title,
          secondary_keywords: safeJsonParse(slot.secondary_keywords_json, []),
          pillar_code: slot.pillar_code,
          search_intent: slot.search_intent || 'commercial',
          custom_instructions: slot.rationale ? `Fokus strategis: ${slot.rationale}` : null
        }
      ],
      pillar_code: slot.pillar_code,
      pillar_codes: [slot.pillar_code],
      job_type: 'autonomous',
      approval_mode: options.approval_mode
    },
    user,
    options
  );

  const createdItem = res.items?.[0] || null;
  await query(
    `UPDATE content_calendar_items
     SET status = 'queued', job_id = ?, item_id = ?
     WHERE id = ?`,
    [res.job?.id || null, createdItem?.id || null, slot.id]
  );

  const [updatedSlot] = await query('SELECT * FROM content_calendar_items WHERE id = ? LIMIT 1', [slot.id]);
  return {
    calendar_item: updatedSlot,
    job: res.job,
    item: createdItem
  };
}

async function recomputeJobProgress(jobId) {
  const rows = await query(
    `SELECT status, COUNT(*) AS cnt FROM content_generation_items WHERE job_id = ? GROUP BY status`,
    [jobId]
  );
  const counts = {};
  let total = 0;
  for (const r of rows) {
    counts[r.status] = Number(r.cnt);
    total += Number(r.cnt);
  }

  const inProgress =
    (counts.queued || 0) + (counts.researching || 0) + (counts.generating || 0) + (counts.auditing || 0);
  const succeeded =
    (counts.awaiting_review || 0) + (counts.approved || 0) + (counts.published || 0) + (counts.saved_draft || 0);
  const failedOrRejected = (counts.failed || 0) + (counts.rejected || 0);
  const cancelled = counts.cancelled || 0;

  let nextStatus = 'running';
  if (inProgress === 0) {
    if (cancelled === total && total > 0) nextStatus = 'cancelled';
    else if (failedOrRejected === total && total > 0) nextStatus = 'failed';
    else if (failedOrRejected > 0 && succeeded > 0) nextStatus = 'partial_failed';
    else if (succeeded > 0 || total === 0) nextStatus = 'completed';
    else nextStatus = 'failed';
  }

  await query(
    `UPDATE content_generation_jobs
     SET status = ?,
         completed_items = ?,
         failed_items = ?,
         completed_at = CASE WHEN ? IN ('completed','partial_failed','failed','cancelled') THEN COALESCE(completed_at, NOW()) ELSE NULL END
     WHERE id = ?`,
    [nextStatus, succeeded, failedOrRejected, nextStatus, jobId]
  );

  return nextStatus;
}

async function recoverStaleQueueItems() {
  try {
    await ensureAutomationSchema();
    const res = await query(
      `UPDATE content_generation_items
       SET status = 'queued'
       WHERE status IN ('researching', 'generating', 'auditing')`
    );
    if (res?.affectedRows > 0) {
      setImmediate(() => {
        triggerQueueWorker().catch(() => {});
      });
    }
  } catch (err) {
    console.warn('[AutomationWorker] Stale lock recovery skipped:', err.message);
  }
}

async function processSingleQueueItem(item, job, settings) {
  await query(
    `UPDATE content_generation_items SET status = 'researching', started_at = COALESCE(started_at, NOW()), error_message = NULL WHERE id = ?`,
    [item.id]
  );
  await query(
    `UPDATE content_generation_jobs SET status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = ?`,
    [job.id]
  );

  const [kbSnapshot, pillars, existingArticles] = await Promise.all([
    getKnowledgeSnapshot(),
    getPillars({ includeInactive: true }),
    query('SELECT id, title, slug, focus_keyphrase FROM blog_articles ORDER BY id DESC LIMIT 60')
  ]);

  const pillar =
    pillars.find((p) => p.code === item.pillar_code) ||
    pillars.find((p) => p.code === job.pillar_code) ||
    pillars[0] ||
    null;

  const secondaryList = String(item.secondary_keywords || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const enginePayload = {
    topic: item.topic,
    target_keyword: item.target_keyword || item.topic,
    secondary_keywords: secondaryList,
    pillar: pillar || {},
    search_intent: item.search_intent || pillar?.default_intent || 'commercial',
    language: item.language || settings.default_language || 'id',
    word_count_target: Number(item.word_count_target || settings.default_word_count || 1050),
    tone: settings.default_tone || 'practitioner_clear',
    enable_web_research: Boolean(item.enable_web_research),
    custom_instructions: item.custom_instructions || '',
    knowledge_base: kbSnapshot,
    existing_articles: existingArticles,
    async_mode: true
  };

  let engineResult;
  try {
    engineResult = await generateArticle({
      payload: enginePayload,
      engineUrl: settings.engine_url,
      asyncMode: true,
      isCancelled: async () => {
        const [jRow] = await query('SELECT cancel_requested FROM content_generation_jobs WHERE id = ? LIMIT 1', [job.id]);
        return Boolean(jRow?.cancel_requested);
      },
      onProgress: async ({ engine_job_id, stage }) => {
        const mappedStage =
          stage === 'composition'
            ? 'generating'
            : stage === 'verification'
              ? 'auditing'
              : ['research', 'brief'].includes(stage)
                ? 'researching'
                : 'generating';
        await query(
          `UPDATE content_generation_items SET engine_job_id = COALESCE(?, engine_job_id), status = ? WHERE id = ?`,
          [engine_job_id || null, mappedStage, item.id]
        ).catch(() => {});
      }
    });
  } catch (err) {
    if (err.code === 'CANCELLED') {
      await query(
        `UPDATE content_generation_items SET status = 'cancelled', completed_at = NOW(), error_message = 'Dibatalkan.' WHERE id = ?`,
        [item.id]
      );
      await recomputeJobProgress(job.id);
      return;
    }

    const transient = !err.statusCode || err.statusCode >= 500 || /timeout|fetch|econnrefused|429/i.test(err.message);
    if (transient && Number(item.retry_count || 0) < Number(item.max_retries || 2)) {
      await query(
        `UPDATE content_generation_items
         SET status = 'queued', retry_count = retry_count + 1, error_message = ?
         WHERE id = ?`,
        [sanitizeErrorMessage(err.message), item.id]
      );
      return;
    }

    await query(
      `UPDATE content_generation_items
       SET status = 'failed', error_message = ?, completed_at = NOW()
       WHERE id = ?`,
      [sanitizeErrorMessage(err.message), item.id]
    );
    await recomputeJobProgress(job.id);
    return;
  }

  // Persist draft and move to auditing stage
  const art = engineResult.article || {};
  const cleanHtml = applyJustifiedBodyAlignment(sanitizeArticleHtml(art.content || ''));
  const draftSlug = slugify(art.slug || art.title || item.topic);
  const faqItems = Array.isArray(art.faq_items) ? art.faq_items : [];
  const tagsList = Array.isArray(art.tags) ? art.tags.map((t) => String(t).trim()).filter(Boolean) : [];
  const resolvedSecondary = String(art.secondary_keyphrases || item.secondary_keywords || tagsList.join(', ') || '');

  await query(
    `UPDATE content_generation_items
     SET status = 'auditing',
         engine_job_id = COALESCE(?, engine_job_id),
         draft_title = ?,
         draft_slug = ?,
         draft_excerpt = ?,
         draft_meta_title = ?,
         draft_meta_description = ?,
         draft_focus_keyphrase = ?,
         draft_secondary_keyphrases = ?,
         draft_content = ?,
         draft_faq_json = ?,
         target_audience = ?,
         recommended_category = ?,
         featured_image_recommendation = ?,
         featured_image_alt = ?,
         generation_trace_json = ?
     WHERE id = ?`,
    [
      engineResult.engine_job_id || null,
      String(art.title || item.topic).slice(0, 250),
      draftSlug,
      String(art.excerpt || '').trim(),
      String(art.meta_title || art.title || item.topic).slice(0, 250),
      String(art.meta_description || art.excerpt || '').slice(0, 320),
      String(art.focus_keyphrase || item.target_keyword || '').slice(0, 190),
      resolvedSecondary,
      cleanHtml,
      JSON.stringify(faqItems),
      art.target_audience ? String(art.target_audience).slice(0, 250) : null,
      art.recommended_category ? String(art.recommended_category).slice(0, 155) : pillar?.name || null,
      art.featured_image_recommendation ? String(art.featured_image_recommendation) : null,
      art.featured_image_alt ? String(art.featured_image_alt).slice(0, 250) : null,
      JSON.stringify({
        trace: art.generation_trace || [],
        warnings: art.warnings || [],
        claims_warnings: art.claims_warnings || [],
        tags: tagsList,
        elapsed_ms: art.elapsed_ms || 0
      }),
      item.id
    ]
  );

  // Load freshly saved item before visual discovery so featured/inline discovery uses current draft fields
  let [savedItem] = await query('SELECT * FROM content_generation_items WHERE id = ?', [item.id]);

  // Stage: AI Visual Discovery & Asset Storage (resilient — never destroys generated article text)
  let imageDiscoveryResult = null;
  if (Number(settings.enable_auto_images ?? 1) === 1) {
    await query(`UPDATE content_generation_items SET status = 'fetching_images' WHERE id = ?`, [item.id]).catch(() => {});
    try {
      imageDiscoveryResult = await discoverAndAttachImagesForItem(savedItem, settings, { pillar });
    } catch (imgErr) {
      imageDiscoveryResult = {
        skipped: false,
        error: sanitizeErrorMessage(imgErr.message),
        featured: null,
        inline: []
      };
    }
    await query(`UPDATE content_generation_items SET status = 'auditing' WHERE id = ?`, [item.id]).catch(() => {});
    [savedItem] = await query('SELECT * FROM content_generation_items WHERE id = ?', [item.id]);
  }
  const itemImages = await getImagesForItemOrArticle({ generationItemId: item.id }).catch(() => []);

  // Run canonical Quality Gate, Visual Quality Audit & SEO/GEO Audit
  let gate = await evaluateQualityGate(
    {
      title: savedItem.draft_title,
      slug: savedItem.draft_slug,
      excerpt: savedItem.draft_excerpt,
      content: savedItem.draft_content,
      featured_image: savedItem.draft_featured_image || '',
      featured_image_alt: savedItem.featured_image_alt || '',
      meta_title: savedItem.draft_meta_title,
      meta_description: savedItem.draft_meta_description,
      focus_keyphrase: savedItem.draft_focus_keyphrase,
      faq_items: faqItems
    },
    settings,
    {
      excludeArticleId: item.target_article_id,
      excludeItemId: item.id,
      pillar,
      images: itemImages
    }
  );

  let autoOptimized = false;
  if (!gate.passed && gate.hard_failures.length === 0 && Number(settings.auto_optimize_below_threshold ?? 1) === 1) {
    try {
      const optResult = await runOneClickOptimize(
        {
          id: savedItem.published_article_id || savedItem.id,
          title: savedItem.draft_title || item.topic,
          slug: savedItem.draft_slug || draftSlug,
          excerpt: savedItem.draft_excerpt || '',
          meta_title: savedItem.draft_meta_title || savedItem.draft_title || '',
          meta_description: savedItem.draft_meta_description || '',
          focus_keyphrase: savedItem.draft_focus_keyphrase || item.target_keyword || '',
          content: savedItem.draft_content || cleanHtml,
          faq_items: faqItems
        },
        existingArticles
      );
      const proposed = optResult?.proposed || {};
      let nextOptHtml = applyJustifiedBodyAlignment(sanitizeArticleHtml(proposed.content || savedItem.draft_content || cleanHtml));
      const selectedInlines = itemImages.filter((r) => r.role === 'inline' && r.is_selected !== 0 && r.status !== 'failed');
      if (selectedInlines.length > 0 && !/<figure\b[^>]*data-ai-inline=["']1["']/i.test(nextOptHtml)) {
        nextOptHtml = insertInlineFiguresInHtml(nextOptHtml, selectedInlines, {
          placement: settings.inline_image_placement || 'after_h2_balanced'
        });
      }
      const nextOptFaq = Array.isArray(proposed.faq_items) && proposed.faq_items.length > 0 ? proposed.faq_items : faqItems;
      const nextOptTitle = String(proposed.title || savedItem.draft_title || item.topic).slice(0, 250);
      const nextOptSlug = slugify(nextOptTitle || savedItem.draft_slug);

      await query(
        `UPDATE content_generation_items
         SET draft_title = ?, draft_slug = ?, draft_meta_title = ?, draft_meta_description = ?,
             draft_focus_keyphrase = ?, draft_excerpt = ?, draft_content = ?, draft_faq_json = ?
         WHERE id = ?`,
        [
          nextOptTitle,
          nextOptSlug,
          String(proposed.meta_title || savedItem.draft_meta_title || nextOptTitle).slice(0, 250),
          String(proposed.meta_description || savedItem.draft_meta_description || '').slice(0, 320),
          String(proposed.focus_keyphrase || savedItem.draft_focus_keyphrase || '').slice(0, 190),
          String(proposed.excerpt || savedItem.draft_excerpt || '').trim(),
          nextOptHtml,
          JSON.stringify(nextOptFaq),
          item.id
        ]
      );
      [savedItem] = await query('SELECT * FROM content_generation_items WHERE id = ?', [item.id]);
      gate = await evaluateQualityGate(
        {
          title: savedItem.draft_title,
          slug: savedItem.draft_slug,
          excerpt: savedItem.draft_excerpt,
          content: savedItem.draft_content,
          featured_image: savedItem.draft_featured_image || '',
          featured_image_alt: savedItem.featured_image_alt || '',
          meta_title: savedItem.draft_meta_title,
          meta_description: savedItem.draft_meta_description,
          focus_keyphrase: savedItem.draft_focus_keyphrase,
          faq_items: nextOptFaq
        },
        settings,
        {
          excludeArticleId: item.target_article_id,
          excludeItemId: item.id,
          pillar,
          images: itemImages
        }
      );
      autoOptimized = true;
    } catch {
      // Keep original draft and audit result if AI auto-optimize call is unavailable
    }
  }

  // Bounded automatic regeneration when score/quality remains below threshold
  const maxRegens = Math.max(0, Math.min(2, Number(settings.max_auto_regenerations ?? 1)));
  if (!gate.passed && Number(item.regeneration_attempts || 0) < maxRegens && !job.cancel_requested) {
    const reasons = [...gate.hard_failures, ...gate.score_failures].map((r) => r.message).slice(0, 4);
    const baseInstr = String(item.custom_instructions || '').split('\n[Auto-Regenerate Guidance]')[0].trim();
    const regenInstr = `${baseInstr ? `${baseInstr}\n` : ''}[Auto-Regenerate Guidance]: Perbaiki draf sebelumnya karena belum lolos Quality Gate (${reasons.join('; ')}). Pastikan panjang minimal ${settings.min_word_count} kata, struktur HTML lengkap dengan H2/H3/FAQ, dan keunikan tinggi.`;

    await query(
      `UPDATE content_generation_items
       SET status = 'queued',
           regeneration_attempts = regeneration_attempts + 1,
           custom_instructions = ?,
           review_notes = ?
       WHERE id = ?`,
      [
        regenInstr.slice(0, 2000),
        `Auto-regeneration #${Number(item.regeneration_attempts || 0) + 1} dijadwalkan (${reasons.join(' | ').slice(0, 250)}).`,
        item.id
      ]
    );
    await recomputeJobProgress(job.id);
    return;
  }

  const reportPayload = {
    passed: gate.passed,
    auto_optimized: autoOptimized,
    regeneration_attempts: Number(item.regeneration_attempts || 0),
    hard_failures: gate.hard_failures,
    score_failures: gate.score_failures,
    warnings: gate.warnings,
    image_quality: gate.image_quality || null,
    image_gate_blocked_auto_publish: Boolean(gate.image_gate_blocked_auto_publish),
    thresholds_used: gate.thresholds_used,
    metrics: gate.analysis?.metrics || {},
    checks: gate.analysis?.checks || []
  };

  let finalStatus = 'awaiting_review';
  let publishedArticleId = null;
  let reviewNotes = null;
  const approvalMode = job.approval_mode || settings.approval_mode || 'manual_approval';

  // Failed audit items or missing featured image must NEVER auto-publish
  if (!gate.passed) {
    if (approvalMode === 'always_save_draft' && gate.hard_failures.length === 0) {
      const pub = await publishGeneratedItem(savedItem, { status: 'draft', onDuplicate: 'update' });
      finalStatus = 'saved_draft';
      publishedArticleId = pub.article_id;
      reviewNotes = 'Disimpan sebagai Draft karena skor di bawah ambang otomatis.';
    } else {
      finalStatus = 'rejected';
      const reasons = [...gate.hard_failures, ...gate.score_failures].map((r) => r.message).slice(0, 5);
      reviewNotes = `Quality Gate belum lolos: ${reasons.join(' | ')}`;
    }
  } else if (approvalMode === 'auto_publish_qualified') {
    if (gate.image_gate_blocked_auto_publish) {
      finalStatus = 'awaiting_review';
      reviewNotes =
        'Lolos Quality Gate SEO/GEO teks, namun featured image belum tersedia; ditahan di Review Visual sebelum publikasi otomatis.';
    } else {
      const pub = await publishGeneratedItem(savedItem, { status: 'published', onDuplicate: 'update' });
      finalStatus = 'published';
      publishedArticleId = pub.article_id;
      reviewNotes = autoOptimized
        ? 'Auto-published setelah dioptimalkan otomatis oleh AI & lolos Quality Gate SEO/GEO + Gambar.'
        : 'Auto-published setelah lolos seluruh Quality Gate SEO/GEO + Gambar.';
    }
  } else if (approvalMode === 'always_save_draft') {
    const pub = await publishGeneratedItem(savedItem, { status: 'draft', onDuplicate: 'update' });
    finalStatus = 'saved_draft';
    publishedArticleId = pub.article_id;
    reviewNotes = 'Lolos Quality Gate; disimpan ke blog_articles sebagai Draft sesuai mode.';
  } else {
    finalStatus = 'awaiting_review';
    if (gate.image_gate_blocked_auto_publish) {
      reviewNotes = 'Lolos Quality Gate teks, menunggu pemilihan/peninjauan featured image oleh admin.';
    } else {
      reviewNotes = autoOptimized
        ? 'Dioptimalkan otomatis oleh AI & lolos Quality Gate; menunggu persetujuan admin.'
        : 'Lolos Quality Gate; menunggu persetujuan admin sebelum publikasi.';
    }
  }

  if (imageDiscoveryResult?.error && reviewNotes) {
    reviewNotes = `${reviewNotes} [Info Gambar: ${imageDiscoveryResult.error}]`.slice(0, 500);
  }

  await query(
    `UPDATE content_generation_items
     SET status = ?,
         seo_score = ?,
         readability_score = ?,
         geo_score = ?,
         composite_score = ?,
         similarity_score = ?,
         similarity_match_title = ?,
         quality_passed = ?,
         quality_report_json = ?,
         image_quality_report_json = ?,
         published_article_id = ?,
         review_notes = ?,
         completed_at = NOW()
     WHERE id = ?`,
    [
      finalStatus,
      gate.analysis?.seo_score || 0,
      gate.analysis?.readability_score || 0,
      gate.analysis?.geo_score || 0,
      gate.analysis?.composite_score || 0,
      gate.duplicate_check?.similarity_score || 0,
      gate.duplicate_check?.matched_title || null,
      gate.passed ? 1 : 0,
      JSON.stringify(reportPayload),
      JSON.stringify(gate.image_quality || null),
      publishedArticleId,
      reviewNotes,
      item.id
    ]
  );

  if (finalStatus === 'published' && publishedArticleId) {
    await query(
      `UPDATE content_calendar_items SET status = 'published', article_id = ? WHERE item_id = ?`,
      [publishedArticleId, item.id]
    ).catch(() => {});
  } else if (['awaiting_review', 'saved_draft'].includes(finalStatus)) {
    await query(
      `UPDATE content_calendar_items SET status = 'generated' WHERE item_id = ? AND status IN ('planned', 'queued')`,
      [item.id]
    ).catch(() => {});
  }

  await recomputeJobProgress(job.id);
}

/**
 * Sequential queue pump. Guarantees serialized processing and safe error isolation per item.
 */
async function triggerQueueWorker() {
  if (isWorkerRunning) {
    hasPendingWork = true;
    return { started: false, alreadyRunning: true };
  }
  isWorkerRunning = true;
  let processed = 0;

  try {
    do {
      hasPendingWork = false;
      const queued = await query(
        `SELECT i.*
         FROM content_generation_items i
         INNER JOIN content_generation_jobs j ON i.job_id = j.id
         WHERE i.status = 'queued'
         ORDER BY i.id ASC
         LIMIT 1`
      );

      if (queued.length === 0) break;

      const item = queued[0];
      const [job] = await query('SELECT * FROM content_generation_jobs WHERE id = ?', [item.job_id]);
      if (!job) {
        await query(`UPDATE content_generation_items SET status = 'failed', error_message = 'Parent job missing' WHERE id = ?`, [
          item.id
        ]);
        continue;
      }

      if (job.cancel_requested) {
        await query(
          `UPDATE content_generation_items SET status = 'cancelled', completed_at = NOW() WHERE job_id = ? AND status = 'queued'`,
          [job.id]
        );
        await recomputeJobProgress(job.id);
        hasPendingWork = true;
        continue;
      }

      const settings = await getSettings();
      await processSingleQueueItem(item, job, settings);
      processed += 1;
      hasPendingWork = true;
    } while (hasPendingWork);
  } finally {
    isWorkerRunning = false;
  }

  return { started: true, processed };
}

async function listJobs({ limit = 25, offset = 0, jobType = '', status = '' } = {}) {
  await ensureAutomationSchema();
  const where = [];
  const params = [];
  if (jobType) {
    where.push('job_type = ?');
    params.push(jobType);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT * FROM content_generation_jobs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows.map((j) => ({
    ...j,
    pillar_codes: normalizePillarCodes(j.pillar_code || '', safeJsonParse(j.pillar_codes_json, []))
  }));
}

async function getJobDetails(jobId) {
  await ensureAutomationSchema();
  const [job] = await query('SELECT * FROM content_generation_jobs WHERE id = ?', [jobId]);
  if (!job) return null;
  const items = await query('SELECT * FROM content_generation_items WHERE job_id = ? ORDER BY id ASC', [jobId]);
  return {
    job: {
      ...job,
      pillar_codes: normalizePillarCodes(job.pillar_code || '', safeJsonParse(job.pillar_codes_json, []))
    },
    items
  };
}

async function listReviewItems({ status = '', pillarCode = '', jobId = null, limit = 50, offset = 0 } = {}) {
  await ensureAutomationSchema();
  const where = [];
  const params = [];
  if (status) {
    where.push('i.status = ?');
    params.push(status);
  }
  if (pillarCode) {
    where.push('i.pillar_code = ?');
    params.push(pillarCode);
  }
  if (jobId) {
    where.push('i.job_id = ?');
    params.push(Number(jobId));
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return query(
    `SELECT i.*, j.job_type, j.approval_mode, j.title AS job_title,
            b.slug AS published_slug, b.status AS blog_status
     FROM content_generation_items i
     LEFT JOIN content_generation_jobs j ON i.job_id = j.id
     LEFT JOIN blog_articles b ON i.published_article_id = b.id
     ${whereSql}
     ORDER BY i.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
}

async function getReviewItem(itemId) {
  await ensureAutomationSchema();
  const rows = await query(
    `SELECT i.*, j.job_type, j.approval_mode, b.slug AS published_slug, b.status AS blog_status
     FROM content_generation_items i
     LEFT JOIN content_generation_jobs j ON i.job_id = j.id
     LEFT JOIN blog_articles b ON i.published_article_id = b.id
     WHERE i.id = ? LIMIT 1`,
    [itemId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const images = await getImagesForItemOrArticle({ generationItemId: r.id }).catch(() => []);
  return {
    ...r,
    draft_faq_items: safeJsonParse(r.draft_faq_json, []),
    quality_report: safeJsonParse(r.quality_report_json, null),
    generation_trace: safeJsonParse(r.generation_trace_json, null),
    image_plan: safeJsonParse(r.image_plan_json, null),
    image_quality_report: safeJsonParse(r.image_quality_report_json, null),
    images
  };
}

async function evaluateAndPersistItemGate(itemId) {
  const existing = await getReviewItem(itemId);
  if (!existing) throw new Error('Item generasi tidak ditemukan.');
  const settings = await getSettings();
  const pillars = await getPillars({ includeInactive: true });
  const pillar = pillars.find((p) => p.code === existing.pillar_code) || null;
  const images = existing.images || [];

  const gate = await evaluateQualityGate(
    {
      title: existing.draft_title,
      slug: existing.draft_slug,
      excerpt: existing.draft_excerpt,
      content: existing.draft_content,
      featured_image: existing.draft_featured_image || '',
      featured_image_alt: existing.featured_image_alt || '',
      meta_title: existing.draft_meta_title,
      meta_description: existing.draft_meta_description,
      focus_keyphrase: existing.draft_focus_keyphrase,
      faq_items: existing.draft_faq_items || []
    },
    settings,
    {
      excludeArticleId: existing.published_article_id || existing.target_article_id,
      excludeItemId: existing.id,
      pillar,
      images
    }
  );

  const reportPayload = {
    passed: gate.passed,
    hard_failures: gate.hard_failures,
    score_failures: gate.score_failures,
    warnings: gate.warnings,
    image_quality: gate.image_quality || null,
    image_gate_blocked_auto_publish: Boolean(gate.image_gate_blocked_auto_publish),
    thresholds_used: gate.thresholds_used,
    metrics: gate.analysis?.metrics || {},
    checks: gate.analysis?.checks || []
  };

  await query(
    `UPDATE content_generation_items
     SET seo_score = ?, readability_score = ?, geo_score = ?, composite_score = ?,
         similarity_score = ?, similarity_match_title = ?, quality_passed = ?,
         quality_report_json = ?, image_quality_report_json = ?
     WHERE id = ?`,
    [
      gate.analysis?.seo_score || 0,
      gate.analysis?.readability_score || 0,
      gate.analysis?.geo_score || 0,
      gate.analysis?.composite_score || 0,
      gate.duplicate_check?.similarity_score || 0,
      gate.duplicate_check?.matched_title || null,
      gate.passed ? 1 : 0,
      JSON.stringify(reportPayload),
      JSON.stringify(gate.image_quality || null),
      itemId
    ]
  );

  return getReviewItem(itemId);
}

async function updateDraftItem(itemId, payload = {}) {
  const existing = await getReviewItem(itemId);
  if (!existing) throw new Error('Item generasi tidak ditemukan.');

  const settings = await getSettings();
  const pillars = await getPillars({ includeInactive: true });
  const pillar = pillars.find((p) => p.code === (payload.pillar_code || existing.pillar_code)) || null;

  const nextTitle = payload.draft_title !== undefined ? String(payload.draft_title).trim() : existing.draft_title;
  const nextSlug = slugify(payload.draft_slug !== undefined ? payload.draft_slug : nextTitle);
  const nextContent =
    payload.draft_content !== undefined
      ? applyJustifiedBodyAlignment(sanitizeArticleHtml(payload.draft_content))
      : existing.draft_content;
  const nextFaq = Array.isArray(payload.draft_faq_items) ? payload.draft_faq_items : existing.draft_faq_items;
  const nextFeatured =
    payload.draft_featured_image !== undefined ? payload.draft_featured_image : existing.draft_featured_image;
  const nextFeaturedAlt =
    payload.featured_image_alt !== undefined ? payload.featured_image_alt : existing.featured_image_alt;
  const nextFeaturedCap =
    payload.draft_featured_image_caption !== undefined
      ? payload.draft_featured_image_caption
      : existing.draft_featured_image_caption;

  const gate = await evaluateQualityGate(
    {
      title: nextTitle,
      slug: nextSlug,
      excerpt: payload.draft_excerpt !== undefined ? payload.draft_excerpt : existing.draft_excerpt,
      content: nextContent,
      featured_image: nextFeatured || '',
      featured_image_alt: nextFeaturedAlt || '',
      meta_title: payload.draft_meta_title !== undefined ? payload.draft_meta_title : existing.draft_meta_title,
      meta_description:
        payload.draft_meta_description !== undefined ? payload.draft_meta_description : existing.draft_meta_description,
      focus_keyphrase:
        payload.draft_focus_keyphrase !== undefined ? payload.draft_focus_keyphrase : existing.draft_focus_keyphrase,
      faq_items: nextFaq
    },
    settings,
    {
      excludeArticleId: existing.published_article_id || existing.target_article_id,
      excludeItemId: existing.id,
      pillar,
      images: existing.images || []
    }
  );

  const reportPayload = {
    passed: gate.passed,
    hard_failures: gate.hard_failures,
    score_failures: gate.score_failures,
    warnings: gate.warnings,
    image_quality: gate.image_quality || null,
    image_gate_blocked_auto_publish: Boolean(gate.image_gate_blocked_auto_publish),
    thresholds_used: gate.thresholds_used,
    metrics: gate.analysis?.metrics || {},
    checks: gate.analysis?.checks || []
  };

  let nextStatus = existing.status;
  if (existing.status === 'rejected' && gate.passed) {
    nextStatus = 'awaiting_review';
  }

  await query(
    `UPDATE content_generation_items
     SET draft_title = ?, draft_slug = ?, draft_excerpt = ?, draft_meta_title = ?, draft_meta_description = ?,
         draft_focus_keyphrase = ?, draft_secondary_keyphrases = ?, draft_content = ?, draft_faq_json = ?,
         draft_featured_image = ?, featured_image_alt = ?, draft_featured_image_caption = ?,
         seo_score = ?, readability_score = ?, geo_score = ?, composite_score = ?,
         similarity_score = ?, similarity_match_title = ?, quality_passed = ?, quality_report_json = ?,
         image_quality_report_json = ?, status = ?
     WHERE id = ?`,
    [
      nextTitle,
      nextSlug,
      payload.draft_excerpt !== undefined ? payload.draft_excerpt : existing.draft_excerpt,
      payload.draft_meta_title !== undefined ? payload.draft_meta_title : existing.draft_meta_title,
      payload.draft_meta_description !== undefined ? payload.draft_meta_description : existing.draft_meta_description,
      payload.draft_focus_keyphrase !== undefined ? payload.draft_focus_keyphrase : existing.draft_focus_keyphrase,
      payload.draft_secondary_keyphrases !== undefined
        ? payload.draft_secondary_keyphrases
        : existing.draft_secondary_keyphrases,
      nextContent,
      JSON.stringify(nextFaq),
      nextFeatured || null,
      nextFeaturedAlt || null,
      nextFeaturedCap || null,
      gate.analysis?.seo_score || 0,
      gate.analysis?.readability_score || 0,
      gate.analysis?.geo_score || 0,
      gate.analysis?.composite_score || 0,
      gate.duplicate_check?.similarity_score || 0,
      gate.duplicate_check?.matched_title || null,
      gate.passed ? 1 : 0,
      JSON.stringify(reportPayload),
      JSON.stringify(gate.image_quality || null),
      nextStatus,
      itemId
    ]
  );

  return getReviewItem(itemId);
}

async function optimizeItemWithAi(itemId) {
  const existing = await getReviewItem(itemId);
  if (!existing) throw new Error('Item generasi tidak ditemukan.');

  const existingArticles = await query('SELECT id, title, slug, focus_keyphrase FROM blog_articles ORDER BY id DESC LIMIT 40');
  const optResult = await runOneClickOptimize(
    {
      id: existing.published_article_id || existing.id,
      title: existing.draft_title || existing.topic,
      slug: existing.draft_slug || slugify(existing.topic),
      excerpt: existing.draft_excerpt || '',
      meta_title: existing.draft_meta_title || existing.draft_title || '',
      meta_description: existing.draft_meta_description || '',
      focus_keyphrase: existing.draft_focus_keyphrase || existing.target_keyword || '',
      content: existing.draft_content || '',
      faq_items: existing.draft_faq_items || []
    },
    existingArticles
  );

  const proposed = optResult.proposed || {};
  let nextOptHtml = proposed.content || existing.draft_content || '';
  const selectedInlines = (existing.images || []).filter(
    (r) => r.role === 'inline' && r.is_selected !== 0 && r.status !== 'failed'
  );
  if (selectedInlines.length > 0 && !/<figure\b[^>]*data-ai-inline=["']1["']/i.test(nextOptHtml)) {
    const settings = await getSettings();
    nextOptHtml = insertInlineFiguresInHtml(nextOptHtml, selectedInlines, {
      placement: settings.inline_image_placement || 'after_h2_balanced'
    });
  }

  const updated = await updateDraftItem(itemId, {
    draft_title: proposed.title,
    draft_meta_title: proposed.meta_title,
    draft_meta_description: proposed.meta_description,
    draft_focus_keyphrase: proposed.focus_keyphrase,
    draft_excerpt: proposed.excerpt,
    draft_content: nextOptHtml,
    draft_faq_items: proposed.faq_items
  });

  return { item: updated, optimization: optResult };
}

async function rediscoverItemImages(itemId) {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item generasi tidak ditemukan.');
  if (!item.draft_content) throw new Error('Draf artikel belum memiliki konten untuk pencarian gambar.');

  const settings = await getSettings();
  const pillars = await getPillars({ includeInactive: true });
  const pillar = pillars.find((p) => p.code === item.pillar_code) || null;

  await discoverAndAttachImagesForItem(item, settings, { pillar, force: true });
  return evaluateAndPersistItemGate(itemId);
}

async function swapItemImage(itemId, payload = {}) {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item generasi tidak ditemukan.');
  const settings = await getSettings();
  await replaceItemImageSlot(item, payload, settings);
  return evaluateAndPersistItemGate(itemId);
}

async function approveAndPublishItem(itemId, user = null, { publishMode = 'published', allowOverride = false, notes = '' } = {}) {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item generasi tidak ditemukan.');
  if (!item.draft_content) throw new Error('Draf konten kosong dan tidak dapat dipublikasikan.');

  const settings = await getSettings();
  const pillars = await getPillars({ includeInactive: true });
  const pillar = pillars.find((p) => p.code === item.pillar_code) || null;

  const gate = await evaluateQualityGate(
    {
      title: item.draft_title,
      slug: item.draft_slug,
      excerpt: item.draft_excerpt,
      content: item.draft_content,
      featured_image: item.draft_featured_image || '',
      featured_image_alt: item.featured_image_alt || '',
      meta_title: item.draft_meta_title,
      meta_description: item.draft_meta_description,
      focus_keyphrase: item.draft_focus_keyphrase,
      faq_items: item.draft_faq_items
    },
    settings,
    {
      excludeArticleId: item.published_article_id || item.target_article_id,
      excludeItemId: item.id,
      pillar,
      images: item.images || []
    }
  );

  // Block hard failures strictly unless fixed; score thresholds & missing featured image can be overridden by admin
  if (gate.hard_failures.length > 0) {
    throw new Error(`Tidak dapat menerbitkan artikel dengan pelanggaran keras: ${gate.hard_failures.map((f) => f.message).join(' | ')}`);
  }
  if (!gate.passed && !allowOverride && publishMode === 'published') {
    throw new Error(`Skor artikel belum memenuhi ambang batas Quality Gate: ${gate.score_failures.map((f) => f.message).join(' | ')}`);
  }
  if (gate.image_gate_blocked_auto_publish && !allowOverride && publishMode === 'published') {
    throw new Error('Featured image belum terpasang. Pilih atau cari gambar terlebih dahulu (atau gunakan Override Admin).');
  }

  const pub = await publishGeneratedItem(item, {
    status: publishMode === 'draft' ? 'draft' : 'published',
    onDuplicate: 'update',
    user,
    notes: notes || (publishMode === 'draft' ? 'Disetujui sebagai Draft oleh admin.' : 'Disetujui & dipublikasikan oleh admin.')
  });

  const nextStatus = publishMode === 'draft' ? 'saved_draft' : 'published';
  await query(
    `UPDATE content_generation_items
     SET status = ?, published_article_id = ?, reviewed_by = ?, review_notes = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [nextStatus, pub.article_id, user?.id || null, notes || 'Disetujui admin.', itemId]
  );
  if (nextStatus === 'published' && pub.article_id) {
    await query(
      `UPDATE content_calendar_items SET status = 'published', article_id = ? WHERE item_id = ?`,
      [pub.article_id, itemId]
    ).catch(() => {});
  }
  await recomputeJobProgress(item.job_id);

  await logActivity({
    actorId: user?.id,
    actorName: user?.name || user?.username,
    actorRole: user?.role,
    action: 'AUTOMATION_PUBLISH_ARTICLE',
    target: `blog_article:${pub.article_id}`,
    details: { itemId, slug: pub.slug, status: pub.status, action: pub.action },
    result: 'success'
  }).catch(() => {});

  return { item: await getReviewItem(itemId), publication: pub };
}

async function rejectItem(itemId, user = null, notes = '') {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item tidak ditemukan.');

  await query(
    `UPDATE content_generation_items
     SET status = 'rejected', reviewed_by = ?, review_notes = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [user?.id || null, notes || 'Ditolak oleh admin.', itemId]
  );
  await recomputeJobProgress(item.job_id);
  return getReviewItem(itemId);
}

async function retryItem(itemId) {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item tidak ditemukan.');

  await query(
    `UPDATE content_generation_items
     SET status = 'queued', error_message = NULL, review_notes = NULL, retry_count = 0, regeneration_attempts = 0
     WHERE id = ?`,
    [itemId]
  );
  await query(`UPDATE content_generation_jobs SET status = 'queued', cancel_requested = 0, completed_at = NULL WHERE id = ?`, [
    item.job_id
  ]);

  setImmediate(() => {
    triggerQueueWorker().catch(() => {});
  });
  return getReviewItem(itemId);
}

async function regenerateItem(itemId, customInstructions = '', user = null) {
  const item = await getReviewItem(itemId);
  if (!item) throw new Error('Item tidak ditemukan.');

  return enqueueManualJob(
    {
      topic: item.topic,
      target_keyword: item.target_keyword,
      secondary_keywords: item.secondary_keywords,
      pillar_code: item.pillar_code,
      search_intent: item.search_intent,
      language: item.language,
      word_count_target: item.word_count_target,
      enable_web_research: Boolean(item.enable_web_research),
      custom_instructions: customInstructions || item.custom_instructions || '',
      target_article_id: item.published_article_id || item.target_article_id || null
    },
    user
  );
}

async function cancelJob(jobId) {
  await query('UPDATE content_generation_jobs SET cancel_requested = 1 WHERE id = ?', [jobId]);
  await query(
    `UPDATE content_generation_items SET status = 'cancelled', completed_at = NOW() WHERE job_id = ? AND status = 'queued'`,
    [jobId]
  );
  const nextStatus = await recomputeJobProgress(jobId);
  return { job_id: jobId, status: nextStatus };
}

module.exports = {
  getSettings,
  updateSettings,
  getDailyGeneratedCount,
  getQueueOverview,
  enqueueManualJob,
  enqueueBatchJob,
  enqueueAutonomousJob,
  queueCalendarItem,
  recoverStaleQueueItems,
  triggerQueueWorker,
  recomputeJobProgress,
  listJobs,
  getJobDetails,
  listReviewItems,
  getReviewItem,
  updateDraftItem,
  optimizeItemWithAi,
  rediscoverItemImages,
  swapItemImage,
  approveAndPublishItem,
  rejectItem,
  retryItem,
  regenerateItem,
  cancelJob
};
