const { query } = require('../../db');
const { ensureAutomationSchema } = require('./automationSchema.service');
const { checkDuplicateAndCannibalization } = require('./qualityGate.service');
const { COMPANY_KNOWLEDGE_SEED, FORBIDDEN_CLAIMS_RULES, VERIFIED_INTERNAL_PATHS } = require('../../data/companyKnowledgeBase');
const { generateAiContentIdeas } = require('../blog/blogAi.service');
const generatorAdapter = require('./generatorAdapter.service');

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function getKnowledgeEntries({ includeInactive = false } = {}) {
  await ensureAutomationSchema();
  const rows = await query(
    `SELECT * FROM content_knowledge_entries ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY category_number ASC, id ASC`
  );
  return rows.map((r) => ({
    ...r,
    facts: safeJsonParse(r.facts_json, [])
  }));
}

async function getKnowledgeSnapshot() {
  const entries = await getKnowledgeEntries({ includeInactive: false });
  return {
    entries: entries.map((e) => ({
      entry_key: e.entry_key,
      category_number: e.category_number,
      category_label: e.category_label,
      title: e.title,
      verification_status: e.verification_status,
      summary: e.summary,
      facts: e.facts,
      content_markdown: e.content_markdown
    })),
    verified_paths: VERIFIED_INTERNAL_PATHS,
    forbidden_claims: FORBIDDEN_CLAIMS_RULES.map((r) => ({
      id: r.id,
      label: r.label,
      reason: r.reason,
      regexes: r.patterns.map((p) => p.source)
    }))
  };
}

async function upsertKnowledgeEntry(entryKey, payload, userId = null) {
  await ensureAutomationSchema();
  const existing = await query('SELECT id FROM content_knowledge_entries WHERE entry_key = ?', [entryKey]);
  const factsJson = JSON.stringify(Array.isArray(payload.facts) ? payload.facts : safeJsonParse(payload.facts_json, []));
  const verStatus = payload.verification_status === 'needs_verification' ? 'needs_verification' : 'verified';
  const isActive = payload.is_active === false || payload.is_active === 0 ? 0 : 1;

  if (existing.length > 0) {
    await query(
      `UPDATE content_knowledge_entries
       SET title = ?, category_label = ?, verification_status = ?, source_reference = ?,
           summary = ?, facts_json = ?, content_markdown = ?, is_active = ?, updated_by = ?
       WHERE entry_key = ?`,
      [
        payload.title,
        payload.category_label || 'Company Information',
        verStatus,
        payload.source_reference || null,
        payload.summary || '',
        factsJson,
        payload.content_markdown || '',
        isActive,
        userId,
        entryKey
      ]
    );
  } else {
    await query(
      `INSERT INTO content_knowledge_entries
       (entry_key, category_number, category_label, title, verification_status, source_reference, summary, facts_json, content_markdown, is_active, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryKey,
        Number(payload.category_number || 15),
        payload.category_label || 'Custom Knowledge',
        payload.title,
        verStatus,
        payload.source_reference || 'Admin Knowledge Base Editor',
        payload.summary || '',
        factsJson,
        payload.content_markdown || '',
        isActive,
        userId
      ]
    );
  }
  const [updated] = await query('SELECT * FROM content_knowledge_entries WHERE entry_key = ?', [entryKey]);
  return { ...updated, facts: safeJsonParse(updated.facts_json, []) };
}

async function syncVerifiedKnowledgeBaseline(userId = null) {
  await ensureAutomationSchema();
  let updatedCount = 0;
  for (const item of COMPANY_KNOWLEDGE_SEED) {
    await query(
      `INSERT INTO content_knowledge_entries
       (entry_key, category_number, category_label, title, verification_status, source_reference, summary, facts_json, content_markdown, is_active, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         category_number = VALUES(category_number),
         category_label = VALUES(category_label),
         title = VALUES(title),
         verification_status = VALUES(verification_status),
         source_reference = VALUES(source_reference),
         summary = VALUES(summary),
         facts_json = VALUES(facts_json),
         content_markdown = VALUES(content_markdown),
         updated_by = VALUES(updated_by)`,
      [
        item.entry_key,
        item.category_number,
        item.category_label,
        item.title,
        item.verification_status,
        item.source_reference,
        item.summary,
        JSON.stringify(item.facts),
        item.content_markdown,
        userId
      ]
    );
    updatedCount++;
  }
  return { synced_entries: updatedCount };
}

async function getPillars({ includeInactive = false } = {}) {
  await ensureAutomationSchema();
  const rows = await query(
    `SELECT * FROM content_pillars ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY sort_order ASC, id ASC`
  );
  const articleCounts = await query(`
    SELECT c.slug AS category_slug,
           COUNT(a.id) AS total_articles,
           SUM(CASE WHEN a.status = 'published' THEN 1 ELSE 0 END) AS published_articles
    FROM blog_categories c
    LEFT JOIN blog_articles a ON a.category_id = c.id
    GROUP BY c.slug
  `);
  const countMap = new Map(articleCounts.map((r) => [r.category_slug, r]));

  return rows.map((p) => {
    const counts = countMap.get(p.category_slug) || { total_articles: 0, published_articles: 0 };
    return {
      ...p,
      sample_topics: safeJsonParse(p.sample_topics_json, []),
      total_articles: Number(counts.total_articles || 0),
      published_articles: Number(counts.published_articles || 0)
    };
  });
}

async function updatePillar(pillarId, payload) {
  await ensureAutomationSchema();
  const [existing] = await query('SELECT * FROM content_pillars WHERE id = ?', [pillarId]);
  if (!existing) return null;
  await query(
    `UPDATE content_pillars
     SET name = ?, description = ?, default_intent = ?, primary_cta_label = ?, primary_cta_path = ?,
         category_slug = ?, sample_topics_json = ?, priority_weight = ?, is_active = ?
     WHERE id = ?`,
    [
      payload.name ?? existing.name,
      payload.description ?? existing.description,
      payload.default_intent ?? existing.default_intent,
      payload.primary_cta_label ?? existing.primary_cta_label,
      payload.primary_cta_path ?? existing.primary_cta_path,
      payload.category_slug ?? existing.category_slug,
      JSON.stringify(Array.isArray(payload.sample_topics) ? payload.sample_topics : safeJsonParse(existing.sample_topics_json, [])),
      Number(payload.priority_weight ?? existing.priority_weight),
      payload.is_active !== undefined ? (payload.is_active ? 1 : 0) : existing.is_active,
      pillarId
    ]
  );
  const [updated] = await query('SELECT * FROM content_pillars WHERE id = ?', [pillarId]);
  return { ...updated, sample_topics: safeJsonParse(updated.sample_topics_json, []) };
}

function normalizePillarCodes(pillarCode = '', pillarCodes = []) {
  const list = Array.isArray(pillarCodes) ? pillarCodes : [];
  const merged = [...list, ...(pillarCode ? [pillarCode] : [])]
    .map((c) => String(c || '').trim())
    .filter(Boolean);
  return Array.from(new Set(merged));
}

function selectBalancedTopics(candidates = [], targetPillarCodes = [], targetCount = 5, allowHighRisk = false) {
  const pool = (candidates || []).filter((c) => allowHighRisk || c.duplicate_risk !== 'high');
  if (pool.length === 0) return [];

  const codes = targetPillarCodes.length > 0
    ? targetPillarCodes
    : Array.from(new Set(pool.map((c) => c.pillar_code).filter(Boolean)));

  if (codes.length <= 1) {
    return pool.slice(0, targetCount);
  }

  const buckets = new Map();
  for (const code of codes) buckets.set(code, []);
  const overflow = [];

  for (const cand of pool) {
    if (cand.pillar_code && buckets.has(cand.pillar_code)) {
      buckets.get(cand.pillar_code).push(cand);
    } else {
      overflow.push(cand);
    }
  }

  for (const arr of buckets.values()) {
    arr.sort((a, b) => Number(b.opportunity_score || 0) - Number(a.opportunity_score || 0));
  }

  const selected = [];
  const seenTitles = new Set();
  let added = true;
  while (selected.length < targetCount && added) {
    added = false;
    for (const code of codes) {
      if (selected.length >= targetCount) break;
      const arr = buckets.get(code) || [];
      while (arr.length > 0) {
        const next = arr.shift();
        const key = String(next.title || '').toLowerCase().trim();
        if (!key || seenTitles.has(key)) continue;
        seenTitles.add(key);
        selected.push(next);
        added = true;
        break;
      }
    }
  }

  if (selected.length < targetCount) {
    for (const extra of overflow) {
      if (selected.length >= targetCount) break;
      const key = String(extra.title || '').toLowerCase().trim();
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      selected.push(extra);
    }
  }

  return selected;
}

/**
 * Discovers topic opportunities either via Python Engine AI Research or fallback Gemini/sample ranking,
 * distributing candidates evenly across chosen content pillars with strict duplicate prevention.
 */
async function discoverTopicOpportunities({
  pillarCode = '',
  pillarCodes = [],
  count = 6,
  useAi = true,
  saveToIdeas = true
} = {}) {
  await ensureAutomationSchema();
  const pillars = await getPillars({ includeInactive: false });
  const selectedCodes = normalizePillarCodes(pillarCode, pillarCodes);
  const targetPillars =
    selectedCodes.length > 0 ? pillars.filter((p) => selectedCodes.includes(p.code)) : pillars;
  const activeTargetCodes = targetPillars.map((p) => p.code);

  const kbSnapshot = await getKnowledgeSnapshot();
  const existingArticles = await query(
    'SELECT id, title, slug, focus_keyphrase FROM blog_articles ORDER BY id DESC LIMIT 120'
  );
  const activeQueueItems = await query(
    `SELECT COALESCE(draft_title, topic) AS title
     FROM content_generation_items
     WHERE status NOT IN ('cancelled', 'failed')
     ORDER BY id DESC
     LIMIT 80`
  ).catch(() => []);
  const plannedCalendar = await query(
    `SELECT title FROM content_calendar_items WHERE status IN ('planned', 'queued') ORDER BY id DESC LIMIT 60`
  ).catch(() => []);

  const existingQueueTitles = Array.from(
    new Set([...activeQueueItems.map((q) => q.title), ...plannedCalendar.map((c) => c.title)].filter(Boolean))
  );

  const gscQueries = await query(
    `SELECT query_text, page_url, clicks, impressions, ctr, position
     FROM blog_gsc_performance
     ORDER BY impressions DESC
     LIMIT 15`
  ).catch(() => []);

  let rawTopics = [];
  let sourceMethod = 'strategy_curated';
  const fetchCount = Math.max(count, activeTargetCodes.length * 2, 6);

  if (useAi) {
    try {
      const engineRes = await generatorAdapter.researchTopics({
        pillar_code: activeTargetCodes[0] || '',
        pillar_codes: activeTargetCodes,
        count: Math.min(20, fetchCount),
        pillars: targetPillars,
        knowledge_base: kbSnapshot,
        existing_titles: existingArticles.map((a) => a.title),
        existing_queue_titles: existingQueueTitles,
        gsc_queries: gscQueries
      });
      if (engineRes && Array.isArray(engineRes.topics) && engineRes.topics.length > 0) {
        rawTopics = engineRes.topics;
        sourceMethod = 'python_engine_ai';
      }
    } catch {
      // Fallback to built-in 1sLabs Gemini strategy generator
      try {
        const clusters = await query('SELECT id, name, pillar_title, target_keyword FROM blog_topic_clusters');
        const pillarSummary = targetPillars.map((p) => p.name).join(', ');
        const aiIdeas = await generateAiContentIdeas({
          clusters,
          gscQueries,
          existingTitles: [...existingArticles.map((a) => a.title), ...existingQueueTitles],
          focusTopic: pillarSummary || '1sLabs Web Development, Custom Software & Free Hosting'
        });
        if (aiIdeas && Array.isArray(aiIdeas.ideas)) {
          rawTopics = aiIdeas.ideas.slice(0, fetchCount).map((idea, idx) => {
            const assignedPillar = targetPillars[idx % Math.max(1, targetPillars.length)] || pillars[0];
            return {
              pillar_code: assignedPillar?.code || 'website-development',
              title: idea.title,
              target_keyword: idea.target_keyword || idea.title,
              secondary_keywords: [],
              search_intent: idea.search_intent || assignedPillar?.default_intent || 'commercial',
              funnel_stage: 'consideration',
              target_audience: 'Pengembang, UMKM, & Pembuat Keputusan IT Indonesia',
              service_target: assignedPillar?.primary_cta_path || '/hosting',
              opportunity_score: 78,
              rationale: idea.rationale || 'Rekomendasi kesenjangan konten 1sLabs.'
            };
          });
          sourceMethod = 'nodejs_gemini_fallback';
        }
      } catch {
        rawTopics = [];
      }
    }
  }

  // Deterministic fallback from verified pillar seeds when offline / no AI available
  if (rawTopics.length === 0) {
    const filteredPillars = targetPillars.length > 0 ? targetPillars : pillars;
    const maxSeeds = Math.max(...filteredPillars.map((p) => (p.sample_topics || []).length), 0);
    for (let sIdx = 0; sIdx < maxSeeds; sIdx++) {
      for (const p of filteredPillars) {
        const sampleTitle = (p.sample_topics || [])[sIdx];
        if (!sampleTitle) continue;
        rawTopics.push({
          pillar_code: p.code,
          title: sampleTitle,
          target_keyword: sampleTitle.split(':')[0].toLowerCase().slice(0, 60),
          secondary_keywords: [p.name],
          search_intent: p.default_intent,
          funnel_stage: p.default_intent === 'transactional' ? 'decision' : 'consideration',
          target_audience: 'Developer, UMKM, dan Pengambil Keputusan Bisnis',
          service_target: p.primary_cta_path,
          opportunity_score: p.priority_weight || 80,
          rationale: `Topik prioritas pilar ${p.name} selaras CTA ${p.primary_cta_path}.`
        });
      }
    }
    rawTopics = rawTopics.slice(0, fetchCount);
    sourceMethod = 'verified_pillar_seeds';
  }

  // Evaluate duplication & cannibalization for each candidate
  const evaluated = [];
  const clusters = await query('SELECT id, name FROM blog_topic_clusters');
  const queueTitleSet = new Set(existingQueueTitles.map((t) => String(t).toLowerCase().trim()));
  const fallbackPillarMap = new Map(targetPillars.map((p) => [p.code, p]));

  for (const cand of rawTopics) {
    const normalizedPillarCode =
      cand.pillar_code && fallbackPillarMap.has(cand.pillar_code)
        ? cand.pillar_code
        : targetPillars[evaluated.length % Math.max(1, targetPillars.length)]?.code || 'website-development';

    const dup = await checkDuplicateAndCannibalization({
      title: cand.title,
      slug: cand.title,
      focusKeyphrase: cand.target_keyword,
      content: `${cand.title} ${cand.rationale || ''}`
    });

    const inQueueOrCalendar = queueTitleSet.has(String(cand.title || '').toLowerCase().trim());
    const isDuplicate = dup.exact_slug_conflict || dup.similarity_score >= 0.72 || inQueueOrCalendar;
    const adjustedScore = Math.max(
      10,
      Math.min(100, Math.round(Number(cand.opportunity_score || 78) - (isDuplicate ? 45 : dup.keyword_conflict ? 15 : 0)))
    );

    const item = {
      ...cand,
      pillar_code: normalizedPillarCode,
      opportunity_score: adjustedScore,
      duplicate_risk: isDuplicate ? 'high' : dup.similarity_score >= 0.5 ? 'medium' : 'low',
      similarity_score: inQueueOrCalendar ? Math.max(dup.similarity_score, 0.9) : dup.similarity_score,
      matched_existing_title: inQueueOrCalendar ? `[Kalender/Antrean] ${cand.title}` : dup.matched_title,
      keyword_conflict: dup.keyword_conflict
    };
    evaluated.push(item);

    if (saveToIdeas && !isDuplicate) {
      const existingIdea = await query('SELECT id FROM blog_content_ideas WHERE title = ? LIMIT 1', [cand.title]);
      if (existingIdea.length === 0) {
        const matchedCluster = clusters[0]?.id || null;
        await query(
          `INSERT INTO blog_content_ideas
           (cluster_id, title, target_keyword, search_intent, priority, rationale, source, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'idea')`,
          [
            matchedCluster,
            cand.title.slice(0, 240),
            String(cand.target_keyword || '').slice(0, 180),
            ['informational', 'commercial', 'transactional', 'navigational'].includes(cand.search_intent)
              ? cand.search_intent
              : 'commercial',
            adjustedScore >= 82 ? 'high' : 'medium',
            `${cand.rationale || ''} [Pillar: ${normalizedPillarCode} | Score: ${adjustedScore}]`,
            gscQueries.length > 0 ? 'gsc_opportunity' : 'ai_gap'
          ]
        ).catch(() => {});
      }
    }
  }

  // Balance returned candidates across selected pillars while keeping duplicates visible below if needed
  const nonDupBalanced = selectBalancedTopics(evaluated, activeTargetCodes, count, false);
  const nonDupTitles = new Set(nonDupBalanced.map((c) => String(c.title).toLowerCase().trim()));
  const remainder = evaluated
    .filter((c) => !nonDupTitles.has(String(c.title).toLowerCase().trim()))
    .sort((a, b) => b.opportunity_score - a.opportunity_score);

  return {
    source: sourceMethod,
    selected_pillars: activeTargetCodes,
    candidates: [...nonDupBalanced, ...remainder].slice(0, Math.max(count, nonDupBalanced.length))
  };
}

async function getContentGapAnalysis() {
  await ensureAutomationSchema();
  const pillars = await getPillars({ includeInactive: false });
  const queueRows = await query(
    `SELECT pillar_code,
            SUM(CASE WHEN status IN ('queued','researching','generating','auditing','awaiting_review','approved') THEN 1 ELSE 0 END) AS queued_count,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS ai_published_count
     FROM content_generation_items
     GROUP BY pillar_code`
  ).catch(() => []);
  const calRows = await query(
    `SELECT pillar_code, COUNT(*) AS planned_count
     FROM content_calendar_items
     WHERE status IN ('planned', 'queued')
     GROUP BY pillar_code`
  ).catch(() => []);

  const qMap = new Map(queueRows.map((r) => [r.pillar_code, r]));
  const cMap = new Map(calRows.map((r) => [r.pillar_code, Number(r.planned_count || 0)]));

  return pillars.map((p) => {
    const q = qMap.get(p.code) || {};
    const publishedCount = Math.max(Number(p.published_articles || 0), Number(q.ai_published_count || 0));
    const queuedCount = Number(q.queued_count || 0);
    const plannedCount = cMap.get(p.code) || 0;
    const gapStatus = publishedCount === 0 ? 'high_gap' : publishedCount < 3 ? 'growing' : 'covered';
    return {
      code: p.code,
      name: p.name,
      category_slug: p.category_slug,
      priority_weight: p.priority_weight,
      published_count: publishedCount,
      queued_count: queuedCount,
      planned_calendar_count: plannedCount,
      gap_status: gapStatus
    };
  });
}

function getJakartaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}

function getIndonesianDayLabel(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 5, 0, 0));
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(dt);
}

function addDaysYmd(ymd, offsetDays) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + offsetDays, 5, 0, 0));
  return getJakartaDateString(dt);
}

async function getContentCalendar({ limit = 42, status = '' } = {}) {
  await ensureAutomationSchema();
  const where = status ? 'WHERE c.status = ?' : '';
  const params = status ? [status, Number(limit)] : [Number(limit)];
  const rows = await query(
    `SELECT c.*, p.name AS pillar_name, p.primary_cta_path
     FROM content_calendar_items c
     LEFT JOIN content_pillars p ON p.code = c.pillar_code
     ${where}
     ORDER BY c.scheduled_date ASC, c.id ASC
     LIMIT ?`,
    params
  );
  return rows.map((r) => ({
    ...r,
    scheduled_date: r.scheduled_date instanceof Date ? getJakartaDateString(r.scheduled_date) : String(r.scheduled_date || '').slice(0, 10),
    secondary_keywords: safeJsonParse(r.secondary_keywords_json, [])
  }));
}

async function generateAiContentCalendar({
  pillarCodes = [],
  days = 7,
  articlesPerDay = 1,
  startDate = null,
  replacePlanned = false,
  useAi = true
} = {}) {
  await ensureAutomationSchema();
  const safeDays = Math.max(1, Math.min(14, Number(days || 7)));
  const safePerDay = Math.max(1, Math.min(3, Number(articlesPerDay || 1)));
  const totalSlots = safeDays * safePerDay;

  const pillars = await getPillars({ includeInactive: false });
  const selectedCodes = normalizePillarCodes('', pillarCodes);
  const targetCodes = selectedCodes.length > 0 ? selectedCodes : pillars.map((p) => p.code);

  if (replacePlanned) {
    await query(`DELETE FROM content_calendar_items WHERE status = 'planned' AND scheduled_date >= ?`, [
      getJakartaDateString(new Date())
    ]);
  }

  const discovery = await discoverTopicOpportunities({
    pillarCodes: targetCodes,
    count: Math.min(20, totalSlots * 2),
    useAi,
    saveToIdeas: false
  });

  const existingPlanned = await query(
    `SELECT title FROM content_calendar_items WHERE status IN ('planned', 'queued', 'generated', 'published')`
  ).catch(() => []);
  const usedTitleSet = new Set(existingPlanned.map((r) => String(r.title || '').toLowerCase().trim()));

  const uniquePool = (discovery.candidates || []).filter(
    (c) => c.duplicate_risk !== 'high' && !usedTitleSet.has(String(c.title || '').toLowerCase().trim())
  );
  const plannedTopics = selectBalancedTopics(uniquePool, targetCodes, totalSlots, false);

  const baseYmd = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : addDaysYmd(getJakartaDateString(), 1);
  const inserted = [];

  for (let idx = 0; idx < plannedTopics.length; idx++) {
    const topic = plannedTopics[idx];
    const dayOffset = Math.floor(idx / safePerDay);
    const ymd = addDaysYmd(baseYmd, dayOffset);
    const dayLabel = getIndonesianDayLabel(ymd);

    const ins = await query(
      `INSERT INTO content_calendar_items
       (scheduled_date, day_label, pillar_code, title, target_keyword, secondary_keywords_json,
        search_intent, target_audience, priority_score, rationale, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')`,
      [
        ymd,
        dayLabel,
        topic.pillar_code || targetCodes[idx % targetCodes.length],
        String(topic.title || '').slice(0, 250),
        String(topic.target_keyword || topic.title || '').slice(0, 190),
        JSON.stringify(Array.isArray(topic.secondary_keywords) ? topic.secondary_keywords : []),
        ['informational', 'commercial', 'transactional', 'navigational'].includes(topic.search_intent)
          ? topic.search_intent
          : 'commercial',
        topic.target_audience ? String(topic.target_audience).slice(0, 250) : null,
        Number(topic.opportunity_score || 80),
        topic.rationale || null
      ]
    );
    inserted.push(ins.insertId);
  }

  return {
    source: discovery.source,
    created_count: inserted.length,
    calendar: await getContentCalendar({ limit: 60 })
  };
}

async function deleteCalendarItem(id) {
  await ensureAutomationSchema();
  await query(`DELETE FROM content_calendar_items WHERE id = ?`, [Number(id)]);
  return { deleted: true, id: Number(id) };
}

module.exports = {
  getKnowledgeEntries,
  getKnowledgeSnapshot,
  upsertKnowledgeEntry,
  syncVerifiedKnowledgeBaseline,
  getPillars,
  updatePillar,
  normalizePillarCodes,
  selectBalancedTopics,
  discoverTopicOpportunities,
  getContentGapAnalysis,
  getContentCalendar,
  generateAiContentCalendar,
  deleteCalendarItem
};

