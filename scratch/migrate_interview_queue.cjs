const { query } = require('../backend/src/db');

async function run() {
  try {
    await query("ALTER TABLE hr_interview_slots ADD COLUMN meeting_link VARCHAR(500) NULL AFTER timezone");
    console.log('[OK] Added meeting_link to hr_interview_slots');
  } catch (e) {
    console.log('hr_interview_slots meeting_link:', e.message);
  }

  try {
    await query("ALTER TABLE hr_interviews ADD COLUMN queue_number INT NULL DEFAULT 1 AFTER slot_id");
    console.log('[OK] Added queue_number to hr_interviews');
  } catch (e) {
    console.log('hr_interviews queue_number:', e.message);
  }

  try {
    await query("ALTER TABLE hr_interviews ADD COLUMN estimated_start_time VARCHAR(10) NULL AFTER queue_number");
    console.log('[OK] Added estimated_start_time to hr_interviews');
  } catch (e) {
    console.log('hr_interviews estimated_start_time:', e.message);
  }

  try {
    await query("ALTER TABLE hr_interviews ADD COLUMN estimated_end_time VARCHAR(10) NULL AFTER estimated_start_time");
    console.log('[OK] Added estimated_end_time to hr_interviews');
  } catch (e) {
    console.log('hr_interviews estimated_end_time:', e.message);
  }

  try {
    await query("ALTER TABLE hr_interviews ADD COLUMN queue_status VARCHAR(20) DEFAULT 'waiting' AFTER status");
    console.log('[OK] Added queue_status to hr_interviews');
  } catch (e) {
    console.log('hr_interviews queue_status:', e.message);
  }

  try {
    await query("ALTER TABLE hr_interviews MODIFY COLUMN status ENUM('pending_selection','scheduled','confirmed','in_progress','completed','rescheduled','cancelled') DEFAULT 'pending_selection'");
    console.log('[OK] Updated status enum in hr_interviews');
  } catch (e) {
    console.log('hr_interviews status enum:', e.message);
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

