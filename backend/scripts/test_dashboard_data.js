const { resourceOptimizerService } = require('../src/services/resourceOptimizer.service');

async function test() {
  const dash = await resourceOptimizerService.getDashboardData();
  console.log('--- DASHBOARD TEST RESULT ---');
  console.log('Dominant %:', dash.status.dominantPct);
  console.log('Badge:', dash.status.badge);
  console.log('Level:', dash.status.level);
  console.log('Hysteresis Active:', dash.status.hysteresisActive);
  console.log('Total Processes:', dash.processes.total);
  console.log('Critical (Protected):', dash.processes.critical);
  console.log('Background:', dash.processes.background);
  console.log('Idle / Prunable:', dash.processes.idle_unnecessary);
  console.log('Top CPU Consumers Count:', dash.topConsumers.cpu.length);
  console.log('History Snapshots Count:', dash.history.length);
  console.log('Recent Logs Count:', dash.recentLogs.length);
  console.log('Trend Prediction:', dash.prediction.trend, 'Risk:', dash.prediction.risk);
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });

