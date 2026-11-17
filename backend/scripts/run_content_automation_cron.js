#!/usr/bin/env node
/**
 * Standalone CLI Cron Runner for 1sLabs AI Content Automation.
 *
 * Usage:
 *   node backend/scripts/run_content_automation_cron.js           # Evaluates active schedules due now (Asia/Jakarta)
 *   node backend/scripts/run_content_automation_cron.js --force=<scheduleId>  # Runs a specific schedule immediately
 *   node backend/scripts/run_content_automation_cron.js --queue-only          # Only processes queued items
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { ensureAutomationSchema } = require('../src/services/automation/automationSchema.service');
const { triggerQueueWorker, recoverStaleQueueItems } = require('../src/services/automation/automationQueue.service');
const { runDueSchedules, executeSchedule } = require('../src/services/automation/automationScheduler.service');

async function main() {
  const args = process.argv.slice(2);
  await ensureAutomationSchema();
  await recoverStaleQueueItems();

  const forceArg = args.find((a) => a.startsWith('--force='));
  if (forceArg) {
    const scheduleId = parseInt(forceArg.split('=')[1], 10);
    if (!scheduleId) {
      throw new Error('ID jadwal --force=<id> tidak valid.');
    }
    const result = await executeSchedule(scheduleId, 'cron');
    console.log('[CronRunner] Force schedule result:', JSON.stringify(result));
    process.exit(0);
  }

  if (args.includes('--queue-only')) {
    const qRes = await triggerQueueWorker();
    console.log('[CronRunner] Queue worker result:', JSON.stringify(qRes));
    process.exit(0);
  }

  const results = await runDueSchedules(new Date());
  const qRes = await triggerQueueWorker();
  console.log('[CronRunner] Completed:', JSON.stringify({ schedules_checked: results.length, results, queue: qRes }));
  process.exit(0);
}

main().catch((err) => {
  console.error('[CronRunner] Fatal error:', err.message);
  process.exit(1);
});

