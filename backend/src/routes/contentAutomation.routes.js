const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdminOrMarketing } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const { ensureAutomationSchema } = require('../services/automation/automationSchema.service');
const { checkEngineHealth } = require('../services/automation/generatorAdapter.service');
const { checkDuplicateAndCannibalization } = require('../services/automation/qualityGate.service');
const {
  getKnowledgeEntries,
  upsertKnowledgeEntry,
  syncVerifiedKnowledgeBaseline,
  getPillars,
  updatePillar,
  normalizePillarCodes,
  discoverTopicOpportunities,
  getContentGapAnalysis,
  getContentCalendar,
  generateAiContentCalendar,
  deleteCalendarItem
} = require('../services/automation/contentStrategy.service');
const {
  getSettings,
  updateSettings,
  getQueueOverview,
  enqueueManualJob,
  enqueueBatchJob,
  enqueueAutonomousJob,
  queueCalendarItem,
  triggerQueueWorker,
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
} = require('../services/automation/automationQueue.service');
const {
  getImageProvidersStatus,
  searchStockImages,
  buildProvidersOrder
} = require('../services/automation/imageManager.service');
const {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listScheduleRuns,
  executeSchedule,
  runDueSchedules
} = require('../services/automation/automationScheduler.service');

function safeTimingEqual(a = '', b = '') {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

router.use(async (req, res, next) => {
  try {
    await ensureAutomationSchema();
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Webhook / External Cron trigger.
 * Accepts either valid `X-Cron-Secret` header or authenticated admin/marketing session.
 */
router.post('/cron/tick', async (req, res) => {
  const cronSecret = (process.env.AUTOMATION_CRON_SECRET || '').trim();
  const provided = String(req.headers['x-cron-secret'] || '').trim();

  if (cronSecret && provided && safeTimingEqual(provided, cronSecret)) {
    try {
      const schedules = await runDueSchedules(new Date());
      const queue = await triggerQueueWorker();
      return res.json({ success: true, triggered_by: 'cron_secret', schedules, queue });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return requireAuth(req, res, () =>
    requireAdminOrMarketing(req, res, async () => {
      try {
        const schedules = await runDueSchedules(new Date());
        const queue = await triggerQueueWorker();
        res.json({ success: true, triggered_by: 'admin', schedules, queue });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    })
  );
});

// Protect all management routes
router.use(requireAuth, requireAdminOrMarketing);

router.get('/overview', async (req, res) => {
  try {
    const [overview, engineHealth] = await Promise.all([
      getQueueOverview(),
      checkEngineHealth()
    ]);
    res.json({ ...overview, engine_health: engineHealth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/engine/health', async (req, res) => {
  try {
    const overrideUrl = req.query.engine_url ? String(req.query.engine_url) : null;
    const health = await checkEngineHealth(overrideUrl);
    res.json({ health });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await updateSettings(req.body || {});
    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name || req.user?.username,
      actorRole: req.user?.role,
      action: 'UPDATE_AUTOMATION_SETTINGS',
      target: 'content_automation_settings:1',
      details: { approval_mode: settings.approval_mode, daily_limit: settings.daily_generation_limit },
      result: 'success'
    }).catch(() => {});
    res.json({ settings });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Knowledge Base
router.get('/knowledge', async (req, res) => {
  try {
    const entries = await getKnowledgeEntries({ includeInactive: true });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/knowledge/:entryKey', async (req, res) => {
  try {
    const entry = await upsertKnowledgeEntry(req.params.entryKey, req.body || {}, req.user?.id);
    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name || req.user?.username,
      actorRole: req.user?.role,
      action: 'UPSERT_KNOWLEDGE_ENTRY',
      target: `kb:${req.params.entryKey}`,
      result: 'success'
    }).catch(() => {});
    res.json({ entry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/knowledge/sync-baseline', async (req, res) => {
  try {
    const result = await syncVerifiedKnowledgeBaseline(req.user?.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Content Strategy & Pillars
router.get('/strategy/pillars', async (req, res) => {
  try {
    const pillars = await getPillars({ includeInactive: true });
    res.json({ pillars });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/strategy/pillars/:id', async (req, res) => {
  try {
    const pillar = await updatePillar(Number(req.params.id), req.body || {});
    res.json({ pillar });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/strategy/discover-topics', async (req, res) => {
  try {
    const { pillar_code = '', pillar_codes = [], count = 6, use_ai = true, save_to_ideas = true } = req.body || {};
    const result = await discoverTopicOpportunities({
      pillarCode: pillar_code,
      pillarCodes: normalizePillarCodes(pillar_code, pillar_codes),
      count: Math.min(25, Math.max(1, Number(count || 6))),
      useAi: Boolean(use_ai),
      saveToIdeas: Boolean(save_to_ideas)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/strategy/gap-analysis', async (req, res) => {
  try {
    const gaps = await getContentGapAnalysis();
    res.json({ gaps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/strategy/calendar', async (req, res) => {
  try {
    const calendar = await getContentCalendar({
      limit: Math.min(100, Number(req.query.limit || 42)),
      status: req.query.status ? String(req.query.status) : ''
    });
    res.json({ calendar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/strategy/calendar/generate', async (req, res) => {
  try {
    const body = req.body || {};
    const result = await generateAiContentCalendar({
      pillarCodes: normalizePillarCodes(body.pillar_code || '', body.pillar_codes),
      days: body.days || 7,
      articlesPerDay: body.articles_per_day || 1,
      startDate: body.start_date || null,
      replacePlanned: Boolean(body.replace_planned),
      useAi: body.use_ai !== false
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/strategy/calendar/:id/queue', async (req, res) => {
  try {
    const result = await queueCalendarItem(Number(req.params.id), req.user, req.body || {});
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/strategy/calendar/:id', async (req, res) => {
  try {
    const result = await deleteCalendarItem(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/strategy/check-duplicate', async (req, res) => {
  try {
    const { title = '', slug = '', focus_keyphrase = '', content = '' } = req.body || {};
    const check = await checkDuplicateAndCannibalization({
      title,
      slug,
      focusKeyphrase: focus_keyphrase,
      content
    });
    res.json({ check });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Autonomous One-Click & Generation Queue (Manual / Batch / Autonomous)
router.post('/run-autonomous', async (req, res) => {
  try {
    const result = await enqueueAutonomousJob(req.body || {}, req.user);
    await logActivity({
      actorId: req.user?.id,
      actorName: req.user?.name || req.user?.username,
      actorRole: req.user?.role,
      action: 'RUN_AUTONOMOUS_AUTOMATION',
      target: `job:${result.job?.id || 'new'}`,
      details: {
        pillars: result.selected_pillars,
        items: result.items?.length || 0,
        discovery_source: result.discovery_source
      },
      result: 'success'
    }).catch(() => {});
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/generate/manual', async (req, res) => {
  try {
    const result = await enqueueManualJob(req.body || {}, req.user);
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/generate/batch', async (req, res) => {
  try {
    const result = await enqueueBatchJob(req.body || {}, req.user);
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/queue/trigger', async (req, res) => {
  try {
    setImmediate(() => {
      triggerQueueWorker().catch(() => {});
    });
    res.json({ triggered: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await listJobs({
      limit: Math.min(100, Number(req.query.limit || 25)),
      offset: Number(req.query.offset || 0),
      jobType: req.query.job_type ? String(req.query.job_type) : '',
      status: req.query.status ? String(req.query.status) : ''
    });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const details = await getJobDetails(Number(req.params.id));
    if (!details) return res.status(404).json({ message: 'Job tidak ditemukan.' });
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/jobs/:id/cancel', async (req, res) => {
  try {
    const result = await cancelJob(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Content Review & Quality Gate
router.get('/items', async (req, res) => {
  try {
    const items = await listReviewItems({
      status: req.query.status ? String(req.query.status) : '',
      pillarCode: req.query.pillar_code ? String(req.query.pillar_code) : '',
      jobId: req.query.job_id ? Number(req.query.job_id) : null,
      limit: Math.min(100, Number(req.query.limit || 40)),
      offset: Number(req.query.offset || 0)
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/items/:id', async (req, res) => {
  try {
    const item = await getReviewItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan.' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const item = await updateDraftItem(Number(req.params.id), req.body || {});
    res.json({ item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/optimize-ai', async (req, res) => {
  try {
    const result = await optimizeItemWithAi(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Automated Image Discovery & Visual Swapping
router.get('/images/providers', async (req, res) => {
  try {
    const settings = await getSettings();
    const health = await checkEngineHealth(settings?.engine_url).catch(() => null);
    res.json({
      providers: getImageProvidersStatus(settings, health?.gemini_configured)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/images/search', async (req, res) => {
  try {
    const q = String(req.body?.query || '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Query pencarian gambar minimal 2 karakter.' });
    }
    const settings = await getSettings();
    const providersOrder = Array.isArray(req.body?.providers) && req.body.providers.length > 0
      ? req.body.providers
      : buildProvidersOrder(settings);
    const excludeUrls = Array.isArray(req.body?.exclude_urls) ? req.body.exclude_urls : [];
    const candidates = await searchStockImages({
      queryText: q,
      providersOrder,
      usedUrls: excludeUrls,
      perProviderLimit: Math.max(3, Math.min(10, Number(req.body?.per_provider || 6)))
    });
    res.json({ query: q, count: candidates.length, candidates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/items/:id/images/discover', async (req, res) => {
  try {
    const item = await rediscoverItemImages(Number(req.params.id));
    res.json({ item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/images/replace', async (req, res) => {
  try {
    const item = await swapItemImage(Number(req.params.id), req.body || {});
    res.json({ item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/approve', async (req, res) => {
  try {
    const { publish_mode = 'published', allow_override = false, notes = '' } = req.body || {};
    const result = await approveAndPublishItem(Number(req.params.id), req.user, {
      publishMode: publish_mode === 'draft' ? 'draft' : 'published',
      allowOverride: Boolean(allow_override),
      notes
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/reject', async (req, res) => {
  try {
    const item = await rejectItem(Number(req.params.id), req.user, req.body?.notes || '');
    res.json({ item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/retry', async (req, res) => {
  try {
    const item = await retryItem(Number(req.params.id));
    res.json({ item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/items/:id/regenerate', async (req, res) => {
  try {
    const result = await regenerateItem(Number(req.params.id), req.body?.custom_instructions || '', req.user);
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Scheduler & Execution History
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await listSchedules();
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/schedules', async (req, res) => {
  try {
    const schedule = await createSchedule(req.body || {});
    res.status(201).json({ schedule });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/schedules/:id', async (req, res) => {
  try {
    const schedule = await updateSchedule(Number(req.params.id), req.body || {});
    res.json({ schedule });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    const result = await deleteSchedule(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/schedules/:id/run', async (req, res) => {
  try {
    const scheduleId = Number(req.params.id);
    if (req.query.sync === 'true') {
      const result = await executeSchedule(scheduleId, 'manual');
      return res.json(result);
    }
    setImmediate(() => {
      executeSchedule(scheduleId, 'manual').catch((err) => {
        console.error(`[Schedule #${scheduleId} Run Error]:`, err.message);
      });
    });
    res.status(202).json({
      started: true,
      schedule_id: scheduleId,
      message: 'Eksekusi jadwal dimulai di background.'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/schedule-runs', async (req, res) => {
  try {
    const runs = await listScheduleRuns({
      scheduleId: req.query.schedule_id ? Number(req.query.schedule_id) : null,
      limit: Math.min(100, Number(req.query.limit || 30))
    });
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

