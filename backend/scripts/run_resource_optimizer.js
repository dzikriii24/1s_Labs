#!/usr/bin/env node
/**
 * Autonomous Intelligent Resource Optimizer CLI / Cron Runner
 * Can be run via crontab:
 * * * * * * source /home/u1zh8984/nodevenv/oneslabs-backend/22/bin/activate && node /home/u1zh8984/oneslabs-backend/scripts/run_resource_optimizer.js >> /home/u1zh8984/tmp/optimizer.log 2>&1
 */
const { resourceOptimizerService } = require('../src/services/resourceOptimizer.service');

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isForce = process.argv.includes('--force');

  console.log(`[${new Date().toISOString()}] Running Intelligent Resource Optimizer... (DryRun: ${isDryRun})`);

  try {
    const result = await resourceOptimizerService.runOptimization({
      triggerType: isForce ? 'manual' : 'cron',
      forceDryRun: isDryRun
    });

    console.log(`[Level]: ${result.evaluation?.badge?.toUpperCase()} (${result.evaluation?.dominant}%)`);
    console.log(`[Summary]: ${result.summary}`);
    if (result.actionsTaken && result.actionsTaken.length > 0) {
      console.log(`[Actions]:`, JSON.stringify(result.actionsTaken, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(`[Error]: ${err.message}`);
    process.exit(1);
  }
}

main();

