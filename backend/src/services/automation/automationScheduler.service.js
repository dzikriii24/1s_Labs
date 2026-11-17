const crypto = require('crypto');
const { query } = require('../../db');
const { ensureAutomationSchema } = require('./automationSchema.service');
const { checkDuplicateAndCannibalization } = require('./qualityGate.service');
const { discoverTopicOpportunities, normalizePillarCodes, selectBalancedTopics } = require('./contentStrategy.service');
const {
  getSettings,
  getDailyGeneratedCount,
  enqueueBatchJob,
  triggerQueueWorker,
  sanitizeErrorMessage: _unused
} = require('./automationQueue.service');
const { sanitizeErrorMessage } = require('./generatorAdapter.service');

let intervalHandle = null;

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function formatScheduleRow(r) {
  if (!r) return r;
  return {
    ...r,
    pillar_codes: normalizePillarCodes(r.pillar_code || '', safeJsonParse(r.pillar_codes_json, [])),
    is_active: Boolean(r.is_active),
    enable_web_research: Boolean(r.enable_web_research),
    is_locked: Boolean(r.locked_at)
  };
}

function getJakartaParts(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false
  });
  const parts = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    dow: dowMap[parts.weekday] ?? 0,
    minuteKey: `${parts.year}-${parts.month}-${parts.day} ${String(hour).padStart(2, '0')}:${parts.minute}`
  };
}

function matchCronField(fieldExpr, value, min, max, isDow = false) {
  const expr = String(fieldExpr || '*').trim();
  if (expr === '*') return true;
  const tokens = expr.split(',');
  for (const rawTok of tokens) {
    const tok = rawTok.trim();
    if (!tok) continue;
    const [rangePart, stepPart] = tok.split('/');
    const step = stepPart ? Math.max(1, parseInt(stepPart, 10) || 1) : 1;

    if (rangePart === '*') {
      if ((value - min) % step === 0) return true;
      continue;
    }

    if (rangePart.includes('-')) {
      const [sStr, eStr] = rangePart.split('-');
      let start = parseInt(sStr, 10);
      let end = parseInt(eStr, 10);
      if (isDow && start === 7) start = 0;
      if (isDow && end === 7) end = 0;
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      if (start <= end) {
        if (value >= start && value <= end && (value - start) % step === 0) return true;
      } else {
        // Wrap-around e.g. 5-1
        if (value >= start || value <= end) return true;
      }
      continue;
    }

    let exact = parseInt(rangePart, 10);
    if (isDow && exact === 7) exact = 0;
    if (!Number.isNaN(exact) && exact >= min && exact <= max && value === exact) {
      return true;
    }
  }
  return false;
}

function cronMatchesJakartaNow(cronExpression, date = new Date()) {
  const fields = String(cronExpression || '').trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const [mExpr, hExpr, domExpr, monExpr, dowExpr] = fields;
  const j = getJakartaParts(date);

  return (
    matchCronField(mExpr, j.minute, 0, 59) &&
    matchCronField(hExpr, j.hour, 0, 23) &&
    matchCronField(domExpr, j.day, 1, 31) &&
    matchCronField(monExpr, j.month, 1, 12) &&
    matchCronField(dowExpr, j.dow, 0, 7, true)
  );
}

function computeNextJakartaRunAt(cronExpression, fromDate = new Date()) {
  const fields = String(cronExpression || '').trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const baseMs = Math.floor(fromDate.getTime() / 60000) * 60000 + 60000;
  // Scan up to 14 days (20160 minutes) cleanly
  for (let i = 0; i < 20160; i++) {
    const candidate = new Date(baseMs + i * 60000);
    if (cronMatchesJakartaNow(cronExpression, candidate)) {
      return candidate;
    }
  }
  return null;
}

function isValidCronExpression(expr) {
  const fields = String(expr || '').trim().split(/\s+/);
  if (fields.length !== 5) return false;
  return fields.every((f) => /^(\*|[0-9,-/*]+)$/.test(f));
}

async function listSchedules() {
  await ensureAutomationSchema();
  const rows = await query('SELECT * FROM content_automation_schedules ORDER BY id ASC');
  return rows.map((r) => ({
    ...formatScheduleRow(r),
    next_run_preview: r.is_active ? computeNextJakartaRunAt(r.cron_expression) : null
  }));
}

async function createSchedule(payload = {}) {
  await ensureAutomationSchema();
  const name = String(payload.name || '').trim();
  if (name.length < 3) throw new Error('Nama jadwal wajib diisi minimal 3 karakter.');
  const cronExpr = String(payload.cron_expression || '0 8 * * 1,4').trim();
  if (!isValidCronExpression(cronExpr)) {
    throw new Error('Format cron tidak valid. Gunakan 5 field cron standar (mis. "0 8 * * 1,4").');
  }

  const jobCode =
    String(payload.job_code || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') || `sched-${Date.now()}`;
  const nextRun = computeNextJakartaRunAt(cronExpr);
  const codes = normalizePillarCodes(payload.pillar_code || '', payload.pillar_codes);

  const ins = await query(
    `INSERT INTO content_automation_schedules
     (job_code, name, description, cron_expression, timezone, pillar_code, pillar_codes_json, articles_per_run,
      approval_mode_override, enable_web_research, is_active, next_run_at, timeout_seconds, retry_limit)
     VALUES (?, ?, ?, ?, 'Asia/Jakarta', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobCode.slice(0, 95),
      name.slice(0, 175),
      payload.description ? String(payload.description).slice(0, 490) : null,
      cronExpr,
      codes[0] || payload.pillar_code || null,
      JSON.stringify(codes),
      Math.max(1, Math.min(10, Number(payload.articles_per_run || 1))),
      ['manual_approval', 'auto_publish_qualified', 'always_save_draft'].includes(payload.approval_mode_override)
        ? payload.approval_mode_override
        : null,
      payload.enable_web_research ? 1 : 0,
      payload.is_active ? 1 : 0,
      nextRun,
      Math.max(60, Math.min(3600, Number(payload.timeout_seconds || 600))),
      Math.max(0, Math.min(3, Number(payload.retry_limit || 1)))
    ]
  );

  const [created] = await query('SELECT * FROM content_automation_schedules WHERE id = ?', [ins.insertId]);
  return formatScheduleRow(created);
}

async function updateSchedule(scheduleId, payload = {}) {
  await ensureAutomationSchema();
  const rows = await query('SELECT * FROM content_automation_schedules WHERE id = ? LIMIT 1', [scheduleId]);
  if (rows.length === 0) throw new Error('Jadwal tidak ditemukan.');
  const current = rows[0];

  const cronExpr =
    payload.cron_expression !== undefined ? String(payload.cron_expression).trim() : current.cron_expression;
  if (!isValidCronExpression(cronExpr)) {
    throw new Error('Format cron 5-field tidak valid.');
  }
  const nextActive = payload.is_active !== undefined ? (payload.is_active ? 1 : 0) : current.is_active;
  const nextRun = nextActive ? computeNextJakartaRunAt(cronExpr) : null;

  const existingCodes = normalizePillarCodes(current.pillar_code || '', safeJsonParse(current.pillar_codes_json, []));
  const nextCodes =
    payload.pillar_codes !== undefined || payload.pillar_code !== undefined
      ? normalizePillarCodes(payload.pillar_code || '', payload.pillar_codes)
      : existingCodes;

  await query(
    `UPDATE content_automation_schedules
     SET name = ?,
         description = ?,
         cron_expression = ?,
         pillar_code = ?,
         pillar_codes_json = ?,
         articles_per_run = ?,
         approval_mode_override = ?,
         enable_web_research = ?,
         is_active = ?,
         next_run_at = ?,
         timeout_seconds = ?,
         retry_limit = ?
     WHERE id = ?`,
    [
      payload.name !== undefined ? String(payload.name).trim().slice(0, 175) : current.name,
      payload.description !== undefined ? payload.description : current.description,
      cronExpr,
      nextCodes[0] || null,
      JSON.stringify(nextCodes),
      payload.articles_per_run !== undefined
        ? Math.max(1, Math.min(10, Number(payload.articles_per_run)))
        : current.articles_per_run,
      payload.approval_mode_override !== undefined
        ? ['manual_approval', 'auto_publish_qualified', 'always_save_draft'].includes(payload.approval_mode_override)
          ? payload.approval_mode_override
          : null
        : current.approval_mode_override,
      payload.enable_web_research !== undefined
        ? payload.enable_web_research
          ? 1
          : 0
        : current.enable_web_research,
      nextActive,
      nextRun,
      payload.timeout_seconds !== undefined
        ? Math.max(60, Math.min(3600, Number(payload.timeout_seconds)))
        : current.timeout_seconds,
      payload.retry_limit !== undefined ? Math.max(0, Math.min(3, Number(payload.retry_limit))) : current.retry_limit,
      scheduleId
    ]
  );

  const [updated] = await query('SELECT * FROM content_automation_schedules WHERE id = ?', [scheduleId]);
  return formatScheduleRow(updated);
}

async function deleteSchedule(scheduleId) {
  await ensureAutomationSchema();
  const rows = await query('SELECT * FROM content_automation_schedules WHERE id = ? LIMIT 1', [scheduleId]);
  if (rows.length === 0) throw new Error('Jadwal tidak ditemukan.');
  if (rows[0].locked_at) throw new Error('Tidak dapat menghapus jadwal yang sedang berjalan.');
  await query('DELETE FROM content_automation_schedules WHERE id = ?', [scheduleId]);
  return { deleted: true, id: scheduleId };
}

async function listScheduleRuns({ scheduleId = null, limit = 30 } = {}) {
  await ensureAutomationSchema();
  const whereSql = scheduleId ? 'WHERE r.schedule_id = ?' : '';
  const params = scheduleId ? [Number(scheduleId), Number(limit)] : [Number(limit)];
  return query(
    `SELECT r.*, s.name AS schedule_name, s.job_code
     FROM content_schedule_runs r
     LEFT JOIN content_automation_schedules s ON r.schedule_id = s.id
     ${whereSql}
     ORDER BY r.id DESC
     LIMIT ?`,
    params
  );
}

/**
 * Executes a schedule with atomic DB concurrency locking and anti-duplication topic selection.
 */
async function executeSchedule(scheduleId, triggerType = 'cron', options = {}) {
  await ensureAutomationSchema();
  const lockToken = crypto.randomUUID();

  // Atomic DB lock acquisition (auto-recovers stale locks past timeout window)
  const lockRes = await query(
    `UPDATE content_automation_schedules
     SET locked_at = NOW(), lock_token = ?
     WHERE id = ?
       AND (locked_at IS NULL OR TIMESTAMPDIFF(SECOND, locked_at, NOW()) > GREATEST(timeout_seconds, 300))`,
    [lockToken, scheduleId]
  );

  if (!lockRes || lockRes.affectedRows === 0) {
    await query(
      `INSERT INTO content_schedule_runs
       (schedule_id, trigger_type, lock_token, status, error_message, completed_at)
       VALUES (?, ?, ?, 'skipped_locked', 'Dilewati karena proses eksekusi jadwal sebelumnya masih memegang kunci.', NOW())`,
      [scheduleId, triggerType === 'manual' ? 'manual' : 'cron', lockToken]
    );
    return { executed: false, skipped_locked: true };
  }

  const [schedule] = await query('SELECT * FROM content_automation_schedules WHERE id = ?', [scheduleId]);
  if (!schedule) {
    await query('UPDATE content_automation_schedules SET locked_at = NULL, lock_token = NULL WHERE id = ?', [scheduleId]);
    throw new Error('Jadwal tidak ditemukan.');
  }

  const runIns = await query(
    `INSERT INTO content_schedule_runs (schedule_id, trigger_type, lock_token, status)
     VALUES (?, ?, ?, 'running')`,
    [schedule.id, triggerType === 'manual' ? 'manual' : 'cron', lockToken]
  );
  const runId = runIns.insertId;

  try {
    const settings = await getSettings();
    const dailyUsed = await getDailyGeneratedCount();
    const remainingQuota = Math.max(0, Number(settings.daily_generation_limit || 20) - dailyUsed);
    if (remainingQuota <= 0) {
      await query(
        `UPDATE content_schedule_runs
         SET status = 'completed', topics_planned = 0, summary_json = ?, completed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify({ message: `Kuota harian telah tercapai (${dailyUsed}/${settings.daily_generation_limit}).` }), runId]
      );
      await query(
        `UPDATE content_automation_schedules
         SET last_run_at = NOW(), last_run_status = 'skipped_daily_quota', next_run_at = ?
         WHERE id = ?`,
        [schedule.is_active ? computeNextJakartaRunAt(schedule.cron_expression) : null, schedule.id]
      );
      return { executed: true, run_id: runId, topics_planned: 0, job_id: null, skipped_quota: true };
    }

    const schedulePillarCodes = normalizePillarCodes(
      schedule.pillar_code || '',
      safeJsonParse(schedule.pillar_codes_json, [])
    );
    const targetCount = Math.min(remainingQuota, Math.max(1, Number(schedule.articles_per_run || 1)));

    const discovery = await discoverTopicOpportunities({
      pillarCode: schedulePillarCodes[0] || schedule.pillar_code || '',
      pillarCodes: schedulePillarCodes,
      count: Math.max(targetCount * 3, schedulePillarCodes.length * 2),
      useAi: options.useAi !== false,
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
      if (cand.duplicate_risk === 'high') continue;
      const titleKey = String(cand.title || '').toLowerCase().trim();
      if (!titleKey || recentTitles.has(titleKey)) continue;
      const dup = await checkDuplicateAndCannibalization({
        title: cand.title,
        slug: cand.title,
        focusKeyphrase: cand.target_keyword,
        content: cand.title
      });
      if (dup.exact_slug_conflict || dup.similarity_score >= Number(settings.max_similarity_threshold || 0.72)) continue;
      recentTitles.add(titleKey);
      nonDupCandidates.push(cand);
    }

    const pickedTopics = selectBalancedTopics(nonDupCandidates, schedulePillarCodes, targetCount, false);
    const selectedTopics = pickedTopics.map((cand) => ({
      topic: cand.title,
      target_keyword: cand.target_keyword || cand.title,
      secondary_keywords: Array.isArray(cand.secondary_keywords) ? cand.secondary_keywords.join(', ') : '',
      pillar_code: cand.pillar_code || schedulePillarCodes[0] || schedule.pillar_code || null,
      search_intent: cand.search_intent || 'commercial'
    }));

    if (selectedTopics.length === 0) {
      await query(
        `UPDATE content_schedule_runs
         SET status = 'completed', topics_planned = 0, summary_json = ?, completed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify({ message: 'Tidak ada topik baru non-duplikat yang tersisa untuk dijalankan.' }), runId]
      );
      await query(
        `UPDATE content_automation_schedules
         SET last_run_at = NOW(), last_run_status = 'completed_no_new_topics', next_run_at = ?
         WHERE id = ?`,
        [schedule.is_active ? computeNextJakartaRunAt(schedule.cron_expression) : null, schedule.id]
      );
      return { executed: true, run_id: runId, topics_planned: 0, job_id: null };
    }

    const batchRes = await enqueueBatchJob(
      {
        title: `Scheduled Run: ${schedule.name}`,
        topics: selectedTopics,
        pillar_code: schedulePillarCodes[0] || schedule.pillar_code || null,
        pillar_codes: schedulePillarCodes,
        job_type: 'scheduled',
        schedule_id: schedule.id,
        approval_mode: schedule.approval_mode_override || settings.approval_mode,
        enable_web_research: Boolean(schedule.enable_web_research)
      },
      null,
      { deferProcessing: true }
    );

    await query(`UPDATE content_schedule_runs SET topics_planned = ?, job_id = ? WHERE id = ?`, [
      selectedTopics.length,
      batchRes.job.id,
      runId
    ]);

    // Trigger queue worker and wait so the schedule lock spans execution and accurate metrics are logged
    await triggerQueueWorker();

    const items = await query('SELECT status FROM content_generation_items WHERE job_id = ?', [batchRes.job.id]);
    const succeeded = items.filter((i) => ['awaiting_review', 'published', 'saved_draft', 'approved'].includes(i.status)).length;
    const failed = items.filter((i) => ['failed', 'rejected'].includes(i.status)).length;
    const published = items.filter((i) => i.status === 'published').length;
    const runStatus =
      failed === items.length && items.length > 0
        ? 'failed'
        : failed > 0 && succeeded > 0
          ? 'partial_failed'
          : 'completed';

    await query(
      `UPDATE content_schedule_runs
       SET status = ?, items_succeeded = ?, items_failed = ?, items_published = ?, summary_json = ?, completed_at = NOW()
       WHERE id = ?`,
      [
        runStatus,
        succeeded,
        failed,
        published,
        JSON.stringify({ job_id: batchRes.job.id, topics: selectedTopics.map((t) => t.topic) }),
        runId
      ]
    );

    await query(
      `UPDATE content_automation_schedules
       SET last_run_at = NOW(), last_run_status = ?, next_run_at = ?
       WHERE id = ?`,
      [runStatus, schedule.is_active ? computeNextJakartaRunAt(schedule.cron_expression) : null, schedule.id]
    );

    return {
      executed: true,
      run_id: runId,
      job_id: batchRes.job.id,
      topics_planned: selectedTopics.length,
      items_succeeded: succeeded,
      items_failed: failed,
      items_published: published,
      status: runStatus
    };
  } catch (err) {
    const safeErr = sanitizeErrorMessage(err?.message || err);
    await query(
      `UPDATE content_schedule_runs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?`,
      [safeErr, runId]
    );
    await query(
      `UPDATE content_automation_schedules SET last_run_at = NOW(), last_run_status = 'failed' WHERE id = ?`,
      [schedule.id]
    );
    throw err;
  } finally {
    await query(
      `UPDATE content_automation_schedules SET locked_at = NULL, lock_token = NULL WHERE id = ? AND lock_token = ?`,
      [scheduleId, lockToken]
    ).catch(() => {});
  }
}

async function runDueSchedules(now = new Date()) {
  await ensureAutomationSchema();
  const activeSchedules = await query('SELECT * FROM content_automation_schedules WHERE is_active = 1 ORDER BY id ASC');
  const nowKey = getJakartaParts(now).minuteKey;
  const results = [];

  for (const sched of activeSchedules) {
    if (!cronMatchesJakartaNow(sched.cron_expression, now)) continue;

    if (sched.last_run_at) {
      const lastDate = new Date(sched.last_run_at);
      if (!Number.isNaN(lastDate.getTime()) && getJakartaParts(lastDate).minuteKey === nowKey) {
        continue;
      }
    }

    try {
      const res = await executeSchedule(sched.id, 'cron');
      results.push({ schedule_id: sched.id, job_code: sched.job_code, ...res });
    } catch (err) {
      results.push({
        schedule_id: sched.id,
        job_code: sched.job_code,
        executed: false,
        error: sanitizeErrorMessage(err?.message || err)
      });
    }
  }

  return results;
}

function startInternalScheduler(pollIntervalMs = 60000) {
  if (process.env.ENABLE_INTERNAL_AUTOMATION_SCHEDULER === 'false') {
    return null;
  }
  if (intervalHandle) return intervalHandle;

  intervalHandle = setInterval(() => {
    runDueSchedules().catch((err) => {
      console.error('[AutomationScheduler] Cron tick error:', sanitizeErrorMessage(err?.message || err));
    });
  }, pollIntervalMs);

  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }
  return intervalHandle;
}

function stopInternalScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  getJakartaParts,
  cronMatchesJakartaNow,
  computeNextJakartaRunAt,
  isValidCronExpression,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listScheduleRuns,
  executeSchedule,
  runDueSchedules,
  startInternalScheduler,
  stopInternalScheduler
};

