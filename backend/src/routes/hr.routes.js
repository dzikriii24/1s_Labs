const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, withTransaction } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  HR_EMAIL_ADDRESS,
  HR_FROM_NAME,
  sendHREmail,
  sendBulkHREmails,
  replacePlaceholders
} = require('../services/hrEmail.service');
const { syncHRInbox } = require('../services/hrInboundEmail.service');
const { formatTextToEmailHtml, htmlToFormattedText } = require('../utils/emailFormatter');

function cleanMojibake(text) {
  if (!text) return '';
  return String(text)
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/â€˜|â€™/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/[“”]/g, '"')
    .replace(/ðŸ“…/g, '')
    .replace(/â°/g, '');
}

// Helper sanitize
function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '').trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// 24-Hour Time Math Helpers for Multi-Candidate Slot Scheduling
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function minutesToTime(totalMin) {
  const norm = ((totalMin % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ========================================================
// 1. PUBLIC ENDPOINTS (No Auth Required for Candidates)
// ========================================================

/**
 * Public: GET /api/hr/public/interview/:token
 * Fetch interview booking options or current booked queue status for candidate
 */
router.get('/public/interview/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) {
      return res.status(400).json({ success: false, message: 'Token penjadwalan tidak valid.' });
    }

    const [interview] = await query(
      `SELECT i.id, i.candidate_id, i.position_id, i.scheduling_token, i.token_expires_at,
              i.slot_id, i.queue_number, i.estimated_start_time, i.estimated_end_time,
              i.queue_status, i.interview_date, i.interview_time, i.timezone,
              i.meeting_platform, i.meeting_link, i.instructions, i.status,
              c.full_name AS candidate_name, c.email AS candidate_email,
              p.name AS position_name, p.department
       FROM hr_interviews i
       JOIN hr_candidates c ON i.candidate_id = c.id
       LEFT JOIN hr_positions p ON i.position_id = p.id
       WHERE i.scheduling_token = ?
       LIMIT 1`,
      [token]
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Tautan interview tidak ditemukan atau sudah tidak berlaku.'
      });
    }

    const isBookedPreviously = interview.status !== 'pending_selection';

    // If candidate has ALREADY booked (scheduled, confirmed, in_progress, completed)
    if (isBookedPreviously) {
      let slotQueue = [];
      let isActiveTurn = false;
      let activeQueueNumber = 1;

      if (interview.slot_id) {
        const queueRows = await query(
          `SELECT i.id, i.queue_number, i.estimated_start_time, i.estimated_end_time,
                  i.status, i.queue_status, c.full_name AS candidate_name
           FROM hr_interviews i
           JOIN hr_candidates c ON i.candidate_id = c.id
           WHERE i.slot_id = ? AND i.status NOT IN ('cancelled', 'rescheduled')
           ORDER BY i.queue_number ASC, i.id ASC`,
          [interview.slot_id]
        );

        // Active turn is the first candidate in the queue who is not completed
        const activeCand = queueRows.find(q => q.status !== 'completed');
        if (activeCand) {
          activeQueueNumber = activeCand.queue_number;
          isActiveTurn = (activeCand.id === interview.id);
        } else {
          activeQueueNumber = null;
          isActiveTurn = false;
        }

        slotQueue = queueRows.map(q => {
          const isYou = q.id === interview.id;
          let displayName = q.candidate_name;
          if (!isYou) {
            // Mask candidate name for privacy
            const parts = q.candidate_name.trim().split(/\s+/);
            if (parts.length > 1) {
              displayName = `${parts[0]} ${parts[1][0]}. (Kandidat lain)`;
            } else {
              displayName = `${parts[0]} (Kandidat lain)`;
            }
          }
          return {
            id: q.id,
            queue_number: q.queue_number,
            candidate_name: displayName,
            is_you: isYou,
            status: q.status,
            queue_status: q.queue_status,
            estimated_start_time: q.estimated_start_time,
            estimated_end_time: q.estimated_end_time
          };
        });
      } else {
        // Manually scheduled interview without slot
        isActiveTurn = interview.status !== 'completed';
        slotQueue = [{
          id: interview.id,
          queue_number: 1,
          candidate_name: interview.candidate_name,
          is_you: true,
          status: interview.status,
          queue_status: interview.queue_status,
          estimated_start_time: interview.interview_time,
          estimated_end_time: ''
        }];
      }

      return res.json({
        success: true,
        is_booked_previously: true,
        is_active_turn: isActiveTurn,
        active_queue_number: activeQueueNumber,
        interview: {
          id: interview.id,
          candidate_name: interview.candidate_name,
          candidate_email: interview.candidate_email,
          position_name: interview.position_name,
          department: interview.department,
          status: interview.status,
          interview_date: interview.interview_date,
          interview_time: interview.interview_time,
          timezone: interview.timezone || 'Asia/Jakarta (WIB)',
          meeting_platform: interview.meeting_platform || 'Google Meet',
          meeting_link: interview.meeting_link,
          instructions: interview.instructions,
          queue_number: interview.queue_number || 1,
          estimated_start_time: interview.estimated_start_time,
          estimated_end_time: interview.estimated_end_time,
          queue_status: interview.queue_status || 'waiting',
          expires_at: interview.token_expires_at
        },
        slot_queue: slotQueue,
        available_slots: []
      });
    }

    // Candidate has NOT chosen a slot yet
    // Check expiration
    const now = new Date();
    const expiry = new Date(interview.token_expires_at);
    if (expiry < now) {
      return res.status(410).json({
        success: false,
        message: 'Tautan interview ini telah kedaluwarsa. Silakan hubungi hr@1slabs.my.id untuk meminta jadwal baru.'
      });
    }

    // Fetch upcoming available slots where booked_count < max_capacity
    const rawSlots = await query(
      `SELECT s.id, s.slot_date, s.start_time, s.end_time, s.duration_minutes, s.timezone,
              s.meeting_link, COALESCE(s.max_capacity, 1) AS max_capacity,
              COUNT(i.id) AS booked_count
       FROM hr_interview_slots s
       LEFT JOIN hr_interviews i ON s.id = i.slot_id AND i.status NOT IN ('cancelled', 'rescheduled')
       WHERE s.is_active = 1 AND s.slot_date >= CURDATE()
       GROUP BY s.id
       HAVING booked_count < max_capacity
       ORDER BY s.slot_date ASC, s.start_time ASC`
    );

    const enrichedSlots = rawSlots.map(s => {
      const startMin = timeToMinutes(s.start_time);
      const endMin = timeToMinutes(s.end_time);
      let totalMin = endMin - startMin;
      if (totalMin <= 0) totalMin = s.duration_minutes || 60;
      const cap = Number(s.max_capacity) || 1;
      const durPerCandidate = Math.max(15, Math.floor(totalMin / cap));
      const bookedCount = Number(s.booked_count) || 0;
      const nextQueue = bookedCount + 1;
      const estStartMin = startMin + (bookedCount * durPerCandidate);
      const estEndMin = estStartMin + durPerCandidate;

      return {
        id: s.id,
        slot_date: s.slot_date,
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.duration_minutes || totalMin,
        timezone: s.timezone,
        meeting_link: s.meeting_link,
        max_capacity: cap,
        booked_count: bookedCount,
        remaining_capacity: cap - bookedCount,
        duration_per_candidate: durPerCandidate,
        next_queue_number: nextQueue,
        estimated_start_time: minutesToTime(estStartMin),
        estimated_end_time: minutesToTime(estEndMin)
      };
    });

    return res.json({
      success: true,
      is_booked_previously: false,
      interview: {
        id: interview.id,
        candidate_name: interview.candidate_name,
        candidate_email: interview.candidate_email,
        position_name: interview.position_name,
        department: interview.department,
        status: interview.status,
        expires_at: interview.token_expires_at
      },
      available_slots: enrichedSlots
    });
  } catch (err) {
    console.error('Error fetching public interview by token:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal interview.' });
  }
});

/**
 * Public: POST /api/hr/public/interview/:token/book
 * Candidate submits selected time slot (with atomic transaction to prevent overbooking capacity)
 */
router.post('/public/interview/:token/book', async (req, res) => {
  try {
    const { token } = req.params;
    const { slot_id, candidate_notes } = req.body;

    if (!slot_id) {
      return res.status(400).json({ success: false, message: 'Silakan pilih slot waktu yang tersedia.' });
    }

    const bookingResult = await withTransaction(async (conn) => {
      // 1. Lock and verify interview token
      const [interviews] = await conn.query(
        `SELECT i.id, i.candidate_id, i.position_id, i.status, i.token_expires_at,
                c.full_name AS candidate_name, c.email AS candidate_email,
                p.name AS position_name
         FROM hr_interviews i
         JOIN hr_candidates c ON i.candidate_id = c.id
         LEFT JOIN hr_positions p ON i.position_id = p.id
         WHERE i.scheduling_token = ? FOR UPDATE`,
        [token]
      );

      if (!interviews || interviews.length === 0) {
        throw new Error('Undangan interview tidak ditemukan.');
      }

      const intv = interviews[0];
      if (intv.status !== 'pending_selection' && intv.status !== 'rescheduled') {
        throw new Error('Interview ini sudah Anda jadwalkan sebelumnya.');
      }

      if (new Date(intv.token_expires_at) < new Date()) {
        throw new Error('Tautan penjadwalan ini sudah kedaluwarsa.');
      }

      // 2. Lock slot
      const [slots] = await conn.query(
        `SELECT id, slot_date, start_time, end_time, duration_minutes, timezone, meeting_link,
                COALESCE(max_capacity, 1) AS max_capacity
         FROM hr_interview_slots 
         WHERE id = ? AND is_active = 1 FOR UPDATE`,
        [slot_id]
      );

      if (!slots || slots.length === 0) {
        throw new Error('Slot waktu tidak ditemukan atau sudah ditutup.');
      }

      const slot = slots[0];

      // 3. Count current bookings in this slot
      const [countRows] = await conn.query(
        `SELECT COUNT(*) AS booked_count 
         FROM hr_interviews 
         WHERE slot_id = ? AND status NOT IN ('cancelled', 'rescheduled') FOR UPDATE`,
        [slot.id]
      );

      const currentBooked = Number(countRows[0]?.booked_count) || 0;
      const maxCap = Number(slot.max_capacity) || 1;

      if (currentBooked >= maxCap) {
        throw new Error('Slot waktu ini baru saja terisi penuh oleh kandidat lain. Silakan pilih slot alternatif.');
      }

      // 4. Calculate queue number and estimated times
      const queueNumber = currentBooked + 1;
      const startMin = timeToMinutes(slot.start_time);
      const endMin = timeToMinutes(slot.end_time);
      let totalMin = endMin - startMin;
      if (totalMin <= 0) totalMin = slot.duration_minutes || 60;
      const durPerCandidate = Math.max(15, Math.floor(totalMin / maxCap));
      const candStartMin = startMin + (currentBooked * durPerCandidate);
      const candEndMin = candStartMin + durPerCandidate;
      const estStartTime = minutesToTime(candStartMin);
      const estEndTime = minutesToTime(candEndMin);
      const slotTimeStr = `${slot.start_time} - ${slot.end_time}`;

      // 5. If this booking fills up the slot, mark slot as booked
      if (queueNumber >= maxCap) {
        await conn.query('UPDATE hr_interview_slots SET is_booked = 1 WHERE id = ?', [slot.id]);
      }

      // 6. Update interview record
      await conn.query(
        `UPDATE hr_interviews 
         SET slot_id = ?, interview_date = ?, interview_time = ?, timezone = ?,
             meeting_platform = 'Google Meet', meeting_link = ?,
             queue_number = ?, estimated_start_time = ?, estimated_end_time = ?,
             queue_status = 'waiting',
             instructions = ?, status = 'scheduled', updated_at = NOW()
         WHERE id = ?`,
        [
          slot.id,
          slot.slot_date,
          slotTimeStr,
          slot.timezone,
          slot.meeting_link || null,
          queueNumber,
          estStartTime,
          estEndTime,
          candidate_notes ? sanitize(candidate_notes).slice(0, 500) : null,
          intv.id
        ]
      );

      // 7. Update candidate status
      await conn.query(
        `UPDATE hr_candidates 
         SET recruitment_status = 'interview_scheduled', last_activity_at = NOW() 
         WHERE id = ?`,
        [intv.candidate_id]
      );

      // 8. Log activity
      await conn.query(
        `INSERT INTO hr_candidate_activities 
         (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
         VALUES (?, 'interview_scheduled', ?, ?, ?, 'Candidate', NOW())`,
        [
          intv.candidate_id,
          `Jadwal Interview Dipilih: ${slot.slot_date} (Antrean #${queueNumber}: ${estStartTime} - ${estEndTime} WIB)`,
          `Kandidat telah memilih slot interview mandiri. Antrean #${queueNumber} (${estStartTime} - ${estEndTime} WIB). Slot: ${slotTimeStr} ${slot.timezone}.`,
          JSON.stringify({ slotId: slot.id, date: slot.slot_date, slotTime: slotTimeStr, queueNumber, estStartTime, estEndTime })
        ]
      );

      // 9. Insert Notification for HR Admin
      await conn.query(
        `INSERT INTO hr_notifications (type, candidate_id, interview_id, title, message, is_read, created_at)
         VALUES ('interview_scheduled', ?, ?, ?, ?, 0, NOW())`,
        [
          intv.candidate_id,
          intv.id,
          `Jadwal Interview Baru: ${intv.candidate_name}`,
          `${intv.candidate_name} memilih slot ${slot.slot_date} (${slotTimeStr}) sebagai Antrean #${queueNumber} (${estStartTime} - ${estEndTime} WIB).`
        ]
      );

      return {
        interview_id: intv.id,
        candidate_name: intv.candidate_name,
        candidate_email: intv.candidate_email,
        position_name: intv.position_name,
        slot_date: slot.slot_date,
        slot_time: slotTimeStr,
        queue_number: queueNumber,
        estimated_start_time: estStartTime,
        estimated_end_time: estEndTime,
        meeting_link: slot.meeting_link,
        timezone: slot.timezone
      };
    });

    return res.json({
      success: true,
      message: 'Jadwal interview berhasil dikonfirmasi! Anda tercatat dalam antrean interview.',
      booking: bookingResult
    });
  } catch (err) {
    console.error('Error booking interview slot:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal menjadwalkan interview. Silakan coba kembali.'
    });
  }
});

// ========================================================
// 2. PROTECTED ADMIN HR ENDPOINTS (Require Authentication)
// ========================================================
router.use(requireAuth);

// Helper check for admin authorization
router.use((req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin' || role === 'super_admin' || role === 'marketing' || role === 'hr') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Akses terbatas untuk Administrator dan HR Manager.'
  });
});

// --------------------------------------------------------
// A. DASHBOARD & ANALYTICS STATS
// --------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    // 1. Metric Counts
    const [candCounts] = await query(`
      SELECT 
        COUNT(*) AS total_candidates,
        SUM(CASE WHEN recruitment_status = 'new_candidate' THEN 1 ELSE 0 END) AS new_candidates,
        SUM(CASE WHEN email_status = 'replied' THEN 1 ELSE 0 END) AS candidates_replied,
        SUM(CASE WHEN recruitment_status = 'offered' THEN 1 ELSE 0 END) AS candidates_accepted,
        SUM(CASE WHEN recruitment_status = 'rejected' THEN 1 ELSE 0 END) AS candidates_rejected
      FROM hr_candidates
    `);

    const [emailStats] = await query(`
      SELECT 
        COUNT(*) AS emails_sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS emails_failed
      FROM hr_email_logs
      WHERE status IN ('sent', 'delivered')
    `);

    const [interviewStats] = await query(`
      SELECT 
        SUM(CASE WHEN status IN ('scheduled', 'confirmed') THEN 1 ELSE 0 END) AS interview_scheduled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS interview_completed
      FROM hr_interviews
    `);

    // 2. Candidates Over Time (Last 14 days)
    const timelineData = await query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM hr_candidates
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 3. Status Breakdown
    const statusBreakdown = await query(`
      SELECT recruitment_status AS status, COUNT(*) AS count
      FROM hr_candidates
      GROUP BY recruitment_status
    `);

    // 4. Recent Email Activity
    const recentEmails = await query(`
      SELECT l.id, l.recipient_name, l.recipient_email, l.subject, l.status, l.sent_at,
             c.id AS candidate_id
      FROM hr_email_logs l
      LEFT JOIN hr_candidates c ON l.candidate_id = c.id
      ORDER BY l.sent_at DESC
      LIMIT 6
    `);

    // 5. Upcoming Interviews
    const upcomingInterviews = await query(`
      SELECT i.id, i.interview_date, i.interview_time, i.timezone, i.meeting_platform, i.meeting_link, i.status,
             c.id AS candidate_id, c.full_name AS candidate_name, c.email AS candidate_email,
             p.name AS position_name
      FROM hr_interviews i
      JOIN hr_candidates c ON i.candidate_id = c.id
      LEFT JOIN hr_positions p ON i.position_id = p.id
      WHERE i.status IN ('scheduled', 'confirmed')
      ORDER BY i.interview_date ASC, i.interview_time ASC
      LIMIT 6
    `);

    // 6. Recent HR Activities
    const recentActivities = await query(`
      SELECT a.id, a.activity_type, a.title, a.description, a.created_by, a.created_at,
             c.id AS candidate_id, c.full_name AS candidate_name
      FROM hr_candidate_activities a
      JOIN hr_candidates c ON a.candidate_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 8
    `);

    return res.json({
      success: true,
      stats: {
        total_candidates: Number(candCounts?.total_candidates || 0),
        new_candidates: Number(candCounts?.new_candidates || 0),
        emails_sent: Number(emailStats?.emails_sent || 0),
        candidates_replied: Number(candCounts?.candidates_replied || 0),
        interview_scheduled: Number(interviewStats?.interview_scheduled || 0),
        interview_completed: Number(interviewStats?.interview_completed || 0),
        candidates_accepted: Number(candCounts?.candidates_accepted || 0),
        candidates_rejected: Number(candCounts?.candidates_rejected || 0)
      },
      timeline: timelineData,
      status_breakdown: statusBreakdown,
      recent_emails: recentEmails,
      upcoming_interviews: upcomingInterviews,
      recent_activities: recentActivities
    });
  } catch (err) {
    console.error('Error fetching HR stats:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat statistik HR.' });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await query(`
      SELECT id, type, candidate_id, interview_id, title, message, is_read, created_at
      FROM hr_notifications
      ORDER BY is_read ASC, created_at DESC
      LIMIT 20
    `);
    return res.json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat notifikasi.' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await query('UPDATE hr_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    await query('UPDATE hr_notifications SET is_read = 1');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menandai semua notifikasi.' });
  }
});

// --------------------------------------------------------
// B. POSITION MANAGEMENT
// --------------------------------------------------------
router.get('/positions', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT p.*,
             COUNT(c.id) AS candidates_count,
             SUM(CASE WHEN c.recruitment_status = 'new_candidate' THEN 1 ELSE 0 END) AS new_candidates_count
      FROM hr_positions p
      LEFT JOIN hr_candidates c ON p.id = c.position_id
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }
    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const positions = await query(sql, params);
    return res.json({ success: true, positions });
  } catch (err) {
    console.error('Error listing positions:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar posisi.' });
  }
});

router.post('/positions', async (req, res) => {
  try {
    const { name, department, employment_type, location, description, requirements, status = 'active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama posisi wajib diisi.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Departemen wajib diisi.' });
    }

    const cleanName = sanitize(name).slice(0, 190);
    const cleanDept = sanitize(department).slice(0, 100);
    const cleanType = ['full_time', 'part_time', 'contract', 'freelance', 'internship'].includes(employment_type)
      ? employment_type
      : 'full_time';
    const cleanLoc = sanitize(location || 'Remote / Bandung').slice(0, 100);
    const cleanDesc = description ? sanitize(description).slice(0, 5000) : null;
    const cleanReq = requirements ? sanitize(requirements).slice(0, 5000) : null;
    const cleanStatus = ['active', 'inactive', 'closed'].includes(status) ? status : 'active';

    const insertRes = await query(
      `INSERT INTO hr_positions 
       (name, department, employment_type, location, description, requirements, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [cleanName, cleanDept, cleanType, cleanLoc, cleanDesc, cleanReq, cleanStatus]
    );

    return res.json({
      success: true,
      message: 'Posisi rekrutmen berhasil ditambahkan!',
      position: { id: insertRes.insertId, name: cleanName, department: cleanDept, status: cleanStatus }
    });
  } catch (err) {
    console.error('Error creating position:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan posisi baru.' });
  }
});

router.put('/positions/:id', async (req, res) => {
  try {
    const { name, department, employment_type, location, description, requirements, status } = req.body;
    const posId = req.params.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama posisi wajib diisi.' });
    }

    await query(
      `UPDATE hr_positions 
       SET name = ?, department = ?, employment_type = ?, location = ?,
           description = ?, requirements = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        sanitize(name).slice(0, 190),
        sanitize(department).slice(0, 100),
        employment_type || 'full_time',
        sanitize(location || 'Remote').slice(0, 100),
        description ? sanitize(description).slice(0, 5000) : null,
        requirements ? sanitize(requirements).slice(0, 5000) : null,
        status || 'active',
        posId
      ]
    );

    return res.json({ success: true, message: 'Posisi berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui posisi.' });
  }
});

router.patch('/positions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }
    await query('UPDATE hr_positions SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: `Status posisi diubah menjadi ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status posisi.' });
  }
});

router.delete('/positions/:id', async (req, res) => {
  try {
    const posId = req.params.id;
    // Check if candidates are attached
    const [cands] = await query('SELECT COUNT(*) AS count FROM hr_candidates WHERE position_id = ?', [posId]);
    if (cands && cands.count > 0) {
      // Archive instead of hard delete
      await query("UPDATE hr_positions SET status = 'closed', updated_at = NOW() WHERE id = ?", [posId]);
      return res.json({
        success: true,
        message: 'Posisi ditutup (diarsipkan) karena terdapat data kandidat terkait.'
      });
    }

    await query('DELETE FROM hr_positions WHERE id = ?', [posId]);
    return res.json({ success: true, message: 'Posisi berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus posisi.' });
  }
});

// --------------------------------------------------------
// C. CANDIDATE MANAGEMENT
// --------------------------------------------------------
router.get('/candidates', async (req, res) => {
  try {
    const {
      search,
      position_id,
      recruitment_status,
      email_status,
      sort_by = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 25
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    let whereConditions = [];
    let params = [];

    if (search && search.trim()) {
      whereConditions.push('(c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (position_id && position_id !== 'all') {
      whereConditions.push('c.position_id = ?');
      params.push(position_id);
    }

    if (recruitment_status && recruitment_status !== 'all') {
      whereConditions.push('c.recruitment_status = ?');
      params.push(recruitment_status);
    }

    if (email_status && email_status !== 'all') {
      whereConditions.push('c.email_status = ?');
      params.push(email_status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortCols = ['created_at', 'last_activity_at', 'full_name', 'recruitment_status'];
    const safeSort = allowedSortCols.includes(sort_by) ? `c.${sort_by}` : 'c.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Total Count
    const [countRow] = await query(`SELECT COUNT(*) AS total FROM hr_candidates c ${whereClause}`, params);
    const total = Number(countRow?.total || 0);

    // Candidates Data
    const candidates = await query(
      `SELECT c.*, p.name AS position_name, p.department
       FROM hr_candidates c
       LEFT JOIN hr_positions p ON c.position_id = p.id
       ${whereClause}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, take, offset]
    );

    return res.json({
      success: true,
      candidates,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        total_pages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('Error fetching candidates:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar kandidat.' });
  }
});

router.get('/candidates/:id', async (req, res) => {
  try {
    const candId = req.params.id;

    const [candidate] = await query(
      `SELECT c.*, p.name AS position_name, p.department, p.employment_type AS position_employment_type
       FROM hr_candidates c
       LEFT JOIN hr_positions p ON c.position_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [candId]
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }

    // Activity Timeline
    const activities = await query(
      `SELECT id, activity_type, title, description, metadata_json, created_by, created_at
       FROM hr_candidate_activities
       WHERE candidate_id = ?
       ORDER BY created_at DESC`,
      [candId]
    );

    // Email Outgoing Logs
    const emailLogs = await query(
      `SELECT id, sender_email, subject, status, sent_at, message_id, error_message
       FROM hr_email_logs
       WHERE candidate_id = ?
       ORDER BY sent_at DESC`,
      [candId]
    );

    // Email Incoming Replies
    const emailReplies = await query(
      `SELECT id, from_email, from_name, subject, body_text, body_html, received_at, status
       FROM hr_email_replies
       WHERE candidate_id = ?
       ORDER BY received_at DESC`,
      [candId]
    );

    // Interviews History
    const interviews = await query(
      `SELECT id, scheduling_token, token_expires_at, interview_date, interview_time,
              timezone, meeting_platform, meeting_link, instructions, status, rating,
              interviewer_notes, created_at
       FROM hr_interviews
       WHERE candidate_id = ?
       ORDER BY created_at DESC`,
      [candId]
    );

    return res.json({
      success: true,
      candidate,
      activities,
      email_logs: emailLogs,
      email_replies: emailReplies,
      interviews
    });
  } catch (err) {
    console.error('Error fetching candidate detail:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail kandidat.' });
  }
});

router.post('/candidates', async (req, res) => {
  try {
    const { full_name, email, phone, position_id, source = 'linkedin', notes, resume_url, portfolio_url } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap kandidat wajib diisi.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Alamat email kandidat tidak valid.' });
    }
    if (!position_id) {
      return res.status(400).json({ success: false, message: 'Posisi yang dilamar wajib dipilih.' });
    }

    const cleanName = sanitize(full_name).slice(0, 190);
    const cleanEmail = email.trim().toLowerCase().slice(0, 190);
    const cleanPhone = phone ? sanitize(phone).slice(0, 45) : null;
    const cleanSource = ['linkedin', 'projects_co_id', 'job_portal', 'referral', 'social_media', 'website', 'other'].includes(source)
      ? source
      : 'other';
    const cleanNotes = notes ? sanitize(notes).slice(0, 5000) : null;

    // Check duplicate
    const [existing] = await query(
      'SELECT id, full_name FROM hr_candidates WHERE LOWER(email) = ? AND position_id = ? LIMIT 1',
      [cleanEmail, position_id]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Kandidat dengan email ${cleanEmail} sudah terdaftar pada posisi ini.`
      });
    }

    const insertRes = await query(
      `INSERT INTO hr_candidates 
       (position_id, full_name, email, phone, source, recruitment_status, email_status, notes, resume_url, portfolio_url, last_activity_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'new_candidate', 'not_contacted', ?, ?, ?, NOW(), NOW())`,
      [position_id, cleanName, cleanEmail, cleanPhone, cleanSource, cleanNotes, resume_url || null, portfolio_url || null]
    );

    const newId = insertRes.insertId;

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, created_by, created_at)
       VALUES (?, 'manual', 'Kandidat Didaftarkan', ?, ?, NOW())`,
      [newId, `Kandidat ditambahkan manual oleh ${req.user.name || 'Admin'} dari sumber ${cleanSource}.`, req.user.name || 'Admin']
    );

    return res.json({
      success: true,
      message: 'Kandidat berhasil ditambahkan!',
      candidate: { id: newId, full_name: cleanName, email: cleanEmail }
    });
  } catch (err) {
    console.error('Error adding candidate:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan kandidat baru.' });
  }
});

router.put('/candidates/:id', async (req, res) => {
  try {
    const { full_name, email, phone, position_id, source, notes, rating, resume_url, portfolio_url } = req.body;
    const candId = req.params.id;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
    }

    await query(
      `UPDATE hr_candidates 
       SET full_name = ?, email = ?, phone = ?, position_id = ?, source = ?,
           notes = ?, rating = ?, resume_url = ?, portfolio_url = ?, last_activity_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [
        sanitize(full_name).slice(0, 190),
        email.trim().toLowerCase().slice(0, 190),
        phone ? sanitize(phone).slice(0, 45) : null,
        position_id,
        source || 'other',
        notes ? sanitize(notes).slice(0, 5000) : null,
        rating || null,
        resume_url || null,
        portfolio_url || null,
        candId
      ]
    );

    return res.json({ success: true, message: 'Data kandidat berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data kandidat.' });
  }
});

router.patch('/candidates/:id/status', async (req, res) => {
  try {
    const { recruitment_status, reason } = req.body;
    const candId = req.params.id;

    const validStatuses = [
      'new_candidate',
      'contacted',
      'responded',
      'screening',
      'interview_scheduled',
      'interview_completed',
      'offered',
      'rejected',
      'on_hold'
    ];

    if (!validStatuses.includes(recruitment_status)) {
      return res.status(400).json({ success: false, message: 'Status recruitment tidak valid.' });
    }

    const [cand] = await query('SELECT full_name, recruitment_status FROM hr_candidates WHERE id = ?', [candId]);
    if (!cand) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }

    const oldStatus = cand.recruitment_status;

    await query(
      `UPDATE hr_candidates 
       SET recruitment_status = ?, last_activity_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [recruitment_status, candId]
    );

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'status_change', ?, ?, ?, ?, NOW())`,
      [
        candId,
        `Status Diperbarui: ${recruitment_status}`,
        `Status seleksi diubah dari "${oldStatus}" menjadi "${recruitment_status}".${reason ? ' Catatan: ' + sanitize(reason) : ''}`,
        JSON.stringify({ oldStatus, newStatus: recruitment_status, reason }),
        req.user.name || 'Admin'
      ]
    );

    return res.json({
      success: true,
      message: `Status kandidat berhasil diubah menjadi ${recruitment_status}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status kandidat.' });
  }
});

router.delete('/candidates/:id', async (req, res) => {
  try {
    const candId = req.params.id;
    await query('DELETE FROM hr_candidates WHERE id = ?', [candId]);
    return res.json({ success: true, message: 'Kandidat berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus kandidat.' });
  }
});

router.post('/candidates/:id/notes', async (req, res) => {
  try {
    const { note } = req.body;
    const candId = req.params.id;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Catatan tidak boleh kosong.' });
    }

    const cleanNote = sanitize(note);

    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, created_by, created_at)
       VALUES (?, 'note_added', 'Catatan HR Ditambahkan', ?, ?, NOW())`,
      [candId, cleanNote, req.user.name || 'Admin']
    );

    await query('UPDATE hr_candidates SET last_activity_at = NOW() WHERE id = ?', [candId]);

    return res.json({ success: true, message: 'Catatan berhasil disimpan!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan catatan.' });
  }
});

// --------------------------------------------------------
// D. EMAIL TEMPLATES & SENDING
// --------------------------------------------------------
router.get('/emails/templates', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM hr_email_templates ORDER BY id ASC');
    const cleaned = (templates || []).map(t => ({
      ...t,
      subject: cleanMojibake(t.subject),
      body_html: cleanMojibake(t.body_html),
      body_text: cleanMojibake(t.body_text)
    }));
    return res.json({ success: true, templates: cleaned });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat template email.' });
  }
});

router.post('/emails/templates', async (req, res) => {
  try {
    const { template_key, name, subject, body_html, body_text } = req.body;
    if (!template_key || !name || !subject || !body_html) {
      return res.status(400).json({ success: false, message: 'Semua field template wajib diisi.' });
    }

    const formattedHtml = formatTextToEmailHtml(body_html);
    const formattedText = body_text ? String(body_text).trim() : htmlToFormattedText(body_html);

    await query(
      `INSERT INTO hr_email_templates (template_key, name, subject, body_html, body_text, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [template_key.trim().toLowerCase(), name.trim(), subject.trim(), formattedHtml, formattedText]
    );

    return res.json({ success: true, message: 'Template email rekrutmen berhasil dibuat!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan template email.' });
  }
});

router.put('/emails/templates/:id', async (req, res) => {
  try {
    const { name, subject, body_html, body_text } = req.body;
    const formattedHtml = formatTextToEmailHtml(body_html);
    const formattedText = body_text ? String(body_text).trim() : htmlToFormattedText(body_html);

    await query(
      `UPDATE hr_email_templates 
       SET name = ?, subject = ?, body_html = ?, body_text = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name.trim(), subject.trim(), formattedHtml, formattedText, req.params.id]
    );
    return res.json({ success: true, message: 'Template email berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui template email.' });
  }
});

router.post('/emails/send', async (req, res) => {
  try {
    const {
      candidate_ids = [],
      template_key = null,
      custom_subject = '',
      custom_body = '',
      campaign_title = 'Email Rekrutmen 1sLabs'
    } = req.body;

    if (!Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Pilih minimal satu kandidat penerima.' });
    }

    // Trigger individual dispatch with privacy guarantee
    const result = await sendBulkHREmails({
      candidateIds: candidate_ids,
      templateKey: template_key,
      customSubject: custom_subject,
      customBody: custom_body,
      campaignTitle: campaign_title
    });

    return res.json({
      success: true,
      message: `Email rekrutmen berhasil diproses! ${result.sent} terkirim, ${result.failed} gagal.`,
      result
    });
  } catch (err) {
    console.error('Error dispatching HR email:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengirim email.' });
  }
});

router.get('/emails/logs', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 25 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    let whereConditions = [];
    let params = [];

    if (search && search.trim()) {
      whereConditions.push('(recipient_email LIKE ? OR recipient_name LIKE ? OR subject LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRow] = await query(`SELECT COUNT(*) AS total FROM hr_email_logs ${whereClause}`, params);
    const total = Number(countRow?.total || 0);

    const logs = await query(
      `SELECT l.*, c.full_name AS candidate_name
       FROM hr_email_logs l
       LEFT JOIN hr_candidates c ON l.candidate_id = c.id
       ${whereClause}
       ORDER BY l.sent_at DESC
       LIMIT ? OFFSET ?`,
      [...params, take, offset]
    );

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        total_pages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat log email.' });
  }
});

router.post('/emails/logs/:id/retry', async (req, res) => {
  try {
    const [log] = await query('SELECT * FROM hr_email_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log email tidak ditemukan.' });
    }

    const result = await sendHREmail({
      candidateId: log.candidate_id,
      campaignId: log.campaign_id,
      to: log.recipient_email,
      toName: log.recipient_name,
      subject: log.subject,
      htmlContent: log.body_html
    });

    if (result.success) {
      await query("UPDATE hr_email_logs SET status = 'sent', error_message = NULL, sent_at = NOW() WHERE id = ?", [log.id]);
      return res.json({ success: true, message: 'Email berhasil dikirim ulang!' });
    } else {
      await query('UPDATE hr_email_logs SET error_message = ? WHERE id = ?', [result.error, log.id]);
      return res.status(400).json({ success: false, message: `Retry gagal: ${result.error}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal retry email.' });
  }
});

// --------------------------------------------------------
// E. HR INBOX & CANDIDATE REPLIES
// --------------------------------------------------------
router.get('/inbox/threads', async (req, res) => {
  try {
    // Automatically trigger fast maildir sync before querying threads
    try {
      await syncHRInbox();
    } catch (syncErr) {
      console.warn('[HRInbox] Auto-sync notice:', syncErr.message);
    }

    const { search, filter = 'all' } = req.query;

    let whereClause = '';
    const params = [];

    if (search && search.trim()) {
      whereClause = 'WHERE (r.from_email LIKE ? OR r.from_name LIKE ? OR r.subject LIKE ? OR c.full_name LIKE ?)';
      const p = `%${search.trim()}%`;
      params.push(p, p, p, p);
    }

    // Group incoming replies by sender email
    const threads = await query(
      `SELECT r.from_email,
              MAX(r.from_name) AS from_name,
              MAX(r.received_at) AS last_message_date,
              SUBSTRING_INDEX(GROUP_CONCAT(r.subject ORDER BY r.received_at DESC SEPARATOR '|||'), '|||', 1) AS last_subject,
              SUBSTRING_INDEX(GROUP_CONCAT(r.body_text ORDER BY r.received_at DESC SEPARATOR '|||'), '|||', 1) AS last_preview,
              SUM(CASE WHEN r.status = 'unread' THEN 1 ELSE 0 END) AS unread_count,
              COUNT(r.id) AS total_messages,
              MAX(r.candidate_id) AS candidate_id,
              MAX(c.full_name) AS candidate_name,
              MAX(p.name) AS position_name,
              MAX(c.recruitment_status) AS recruitment_status,
              MAX(c.email_status) AS email_status
       FROM hr_email_replies r
       LEFT JOIN hr_candidates c ON r.candidate_id = c.id
       LEFT JOIN hr_positions p ON c.position_id = p.id
       ${whereClause}
       GROUP BY r.from_email
       ORDER BY last_message_date DESC`,
      params
    );

    let filtered = threads;
    if (filter === 'unread') {
      filtered = threads.filter(t => t.unread_count > 0);
    } else if (filter === 'candidates_only') {
      filtered = threads.filter(t => Boolean(t.candidate_id));
    }

    return res.json({ success: true, threads: filtered });
  } catch (err) {
    console.error('Error fetching HR inbox threads:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat inbox HR.' });
  }
});

router.get('/inbox/messages/:email', async (req, res) => {
  try {
    const targetEmail = req.params.email.toLowerCase().trim();

    // 1. Fetch incoming replies from this email
    const incoming = await query(
      `SELECT id, from_email, from_name, subject, body_text, body_html, received_at AS message_date,
              status, 'incoming' AS direction
       FROM hr_email_replies
       WHERE LOWER(from_email) = ?
       ORDER BY received_at ASC`,
      [targetEmail]
    );

    // 2. Fetch outgoing emails sent to this email
    const outgoing = await query(
      `SELECT id, sender_email AS from_email, '1sLabs HR' AS from_name, subject,
              body_html AS body_text, body_html, sent_at AS message_date,
              status, 'outgoing' AS direction
       FROM hr_email_logs
       WHERE LOWER(recipient_email) = ?
       ORDER BY sent_at ASC`,
      [targetEmail]
    );

    // Combine and sort chronologically
    const allMessages = [...incoming, ...outgoing].sort(
      (a, b) => new Date(a.message_date).getTime() - new Date(b.message_date).getTime()
    );

    // Candidate details
    const [candidate] = await query(
      `SELECT c.*, p.name AS position_name
       FROM hr_candidates c
       LEFT JOIN hr_positions p ON c.position_id = p.id
       WHERE LOWER(c.email) = ? LIMIT 1`,
      [targetEmail]
    );

    return res.json({
      success: true,
      candidate: candidate || null,
      messages: allMessages
    });
  } catch (err) {
    console.error('Error fetching thread messages:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat pesan email.' });
  }
});

router.post('/inbox/sync', async (req, res) => {
  try {
    const syncRes = await syncHRInbox();
    return res.json({
      success: true,
      message: `Sinkronisasi selesai. Ditemukan ${syncRes.imported} pesan baru dari ${syncRes.scanned} file.`,
      result: syncRes
    });
  } catch (err) {
    console.error('Error syncing HR inbox:', err);
    return res.status(500).json({ success: false, message: 'Gagal melakukan sinkronisasi kotak masuk HR.' });
  }
});

router.post('/inbox/reply', async (req, res) => {
  try {
    const { recipient_email, subject, message_text, candidate_id } = req.body;

    if (!recipient_email || !message_text || !message_text.trim()) {
      return res.status(400).json({ success: false, message: 'Alamat penerima dan pesan balasan wajib diisi.' });
    }

    const cleanSubj = subject ? sanitize(subject) : 'Balasan dari 1sLabs Recruitment';

    const result = await sendHREmail({
      candidateId: candidate_id || null,
      to: recipient_email,
      subject: cleanSubj,
      htmlContent: `<p>${sanitize(message_text).replace(/\n/g, '<br/>')}</p>`,
      textContent: message_text
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: `Gagal mengirim balasan: ${result.error}` });
    }

    // Mark previous unread replies from this email as replied/read
    await query(
      "UPDATE hr_email_replies SET status = 'replied' WHERE LOWER(from_email) = ?",
      [recipient_email.toLowerCase().trim()]
    );

    return res.json({ success: true, message: 'Balasan email berhasil dikirim!' });
  } catch (err) {
    console.error('Error sending reply from HR inbox:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengirim balasan.' });
  }
});

router.patch('/inbox/read/:id', async (req, res) => {
  try {
    await query("UPDATE hr_email_replies SET status = 'read' WHERE id = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status baca.' });
  }
});

router.post('/inbox/connect-candidate', async (req, res) => {
  try {
    const { reply_id, position_id, full_name } = req.body;
    const [reply] = await query('SELECT * FROM hr_email_replies WHERE id = ?', [reply_id]);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Pesan email tidak ditemukan.' });
    }

    // Check if candidate exists by email
    let [candidate] = await query('SELECT id FROM hr_candidates WHERE LOWER(email) = ?', [reply.from_email.toLowerCase()]);

    let candidateId = candidate?.id;
    if (!candidateId) {
      if (!position_id) {
        return res.status(400).json({ success: false, message: 'Pilih posisi rekrutmen untuk membuat kandidat baru.' });
      }
      const ins = await query(
        `INSERT INTO hr_candidates (position_id, full_name, email, source, recruitment_status, email_status, last_activity_at, created_at)
         VALUES (?, ?, ?, 'other', 'responded', 'replied', NOW(), NOW())`,
        [position_id, full_name || reply.from_name || reply.from_email.split('@')[0], reply.from_email]
      );
      candidateId = ins.insertId;
    }

    // Link reply
    await query('UPDATE hr_email_replies SET candidate_id = ? WHERE from_email = ?', [candidateId, reply.from_email]);

    return res.json({ success: true, message: 'Kandidat berhasil dihubungkan!', candidate_id: candidateId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghubungkan kandidat.' });
  }
});

// --------------------------------------------------------
// F. INTERVIEW SLOTS (AVAILABILITY)
// --------------------------------------------------------
router.get('/interview-slots', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql = `
      SELECT s.*, 
             COALESCE(s.max_capacity, 1) AS max_capacity,
             (SELECT COUNT(*) FROM hr_interviews i WHERE i.slot_id = s.id AND i.status NOT IN ('cancelled', 'rescheduled')) AS booked_count
      FROM hr_interview_slots s 
      WHERE s.slot_date >= CURDATE()
    `;
    const params = [];

    if (start_date) {
      sql += ' AND s.slot_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND s.slot_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY s.slot_date ASC, s.start_time ASC';
    const slots = await query(sql, params);

    // Fetch candidate details for each slot to show booked queue in admin
    for (const slot of slots) {
      const candidatesInSlot = await query(
        `SELECT i.id, i.queue_number, i.estimated_start_time, i.estimated_end_time, i.status, i.queue_status,
                c.full_name AS candidate_name
         FROM hr_interviews i
         JOIN hr_candidates c ON i.candidate_id = c.id
         WHERE i.slot_id = ? AND i.status NOT IN ('cancelled', 'rescheduled')
         ORDER BY i.queue_number ASC`,
        [slot.id]
      );
      slot.candidates = candidatesInSlot;
    }

    return res.json({ success: true, slots });
  } catch (err) {
    console.error('Error fetching interview slots:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat slot interview.' });
  }
});

router.post('/interview-slots', async (req, res) => {
  try {
    const {
      slot_date,
      start_time,
      end_time,
      meeting_link,
      max_capacity = 1,
      duration_minutes,
      timezone = 'Asia/Jakarta (WIB)'
    } = req.body;

    if (!slot_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Tanggal, jam mulai, dan jam selesai wajib diisi.' });
    }

    if (!meeting_link || !meeting_link.trim()) {
      return res.status(400).json({ success: false, message: 'Link Google Meet wajib disertakan untuk membuka slot ketersediaan baru.' });
    }

    const cleanCapacity = Math.max(1, parseInt(max_capacity, 10) || 1);
    const startMin = timeToMinutes(start_time);
    const endMin = timeToMinutes(end_time);
    let totalDur = endMin - startMin;
    if (totalDur <= 0) totalDur = duration_minutes || 60;

    // Check duplicate slot
    const [dup] = await query(
      'SELECT id FROM hr_interview_slots WHERE slot_date = ? AND start_time = ? LIMIT 1',
      [slot_date, start_time]
    );
    if (dup) {
      return res.status(409).json({ success: false, message: 'Slot waktu tersebut sudah ada di tanggal yang dipilih.' });
    }

    const ins = await query(
      `INSERT INTO hr_interview_slots 
       (slot_date, start_time, end_time, duration_minutes, timezone, meeting_link, max_capacity, is_booked, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW())`,
      [slot_date, start_time, end_time, totalDur, timezone, meeting_link.trim(), cleanCapacity]
    );

    return res.json({ success: true, message: 'Slot interview baru berhasil ditambahkan!', slot_id: ins.insertId });
  } catch (err) {
    console.error('Error creating interview slot:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan slot interview.' });
  }
});

router.delete('/interview-slots/:id', async (req, res) => {
  try {
    const slotId = req.params.id;
    const [cnt] = await query(
      `SELECT COUNT(*) AS active_count FROM hr_interviews WHERE slot_id = ? AND status NOT IN ('cancelled')`,
      [slotId]
    );
    if (cnt && cnt.active_count > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus slot karena terdapat ${cnt.active_count} kandidat yang terjadwal pada slot ini.`
      });
    }
    await query('DELETE FROM hr_interview_slots WHERE id = ?', [slotId]);
    return res.json({ success: true, message: 'Slot berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus slot.' });
  }
});

router.patch('/interview-slots/:id/toggle', async (req, res) => {
  try {
    await query('UPDATE hr_interview_slots SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Status slot ketersediaan diubah.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status slot.' });
  }
});

// --------------------------------------------------------
// G. INTERVIEW MANAGEMENT
// --------------------------------------------------------
router.get('/interviews', async (req, res) => {
  try {
    const { status, search } = req.query;
    let whereConditions = [];
    let params = [];

    if (status && status !== 'all') {
      whereConditions.push('i.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      whereConditions.push('(c.full_name LIKE ? OR c.email LIKE ? OR p.name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const interviews = await query(
      `SELECT i.*, c.full_name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone,
              p.name AS position_name, p.department
       FROM hr_interviews i
       JOIN hr_candidates c ON i.candidate_id = c.id
       LEFT JOIN hr_positions p ON i.position_id = p.id
       ${whereClause}
       ORDER BY 
         CASE 
           WHEN i.interview_date IS NULL THEN 1 
           ELSE 0 
         END,
         i.interview_date DESC,
         i.interview_time DESC`,
      params
    );

    return res.json({ success: true, interviews });
  } catch (err) {
    console.error('Error listing interviews:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal interview.' });
  }
});

/**
 * Generate interview invitation link & send email to candidate
 */
router.post('/interviews/invite', async (req, res) => {
  try {
    const { candidate_id, send_email = true } = req.body;
    if (!candidate_id) {
      return res.status(400).json({ success: false, message: 'Kandidat wajib dipilih.' });
    }

    const [candidate] = await query(
      `SELECT c.id, c.full_name, c.email, c.position_id, p.name AS position_name
       FROM hr_candidates c
       LEFT JOIN hr_positions p ON c.position_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [candidate_id]
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }

    // Generate secure 64-char token expiring in 14 days
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const insertRes = await query(
      `INSERT INTO hr_interviews 
       (candidate_id, position_id, scheduling_token, token_expires_at, status, created_at)
       VALUES (?, ?, ?, ?, 'pending_selection', NOW())`,
      [candidate.id, candidate.position_id, token, expiresAt]
    );

    const schedulingUrl = `${process.env.BASE_URL || 'https://1slabs.my.id'}/interview/schedule/${token}`;

    if (send_email) {
      const emailRes = await sendHREmail({
        candidateId: candidate.id,
        to: candidate.email,
        toName: candidate.full_name,
        subject: `Undangan Interview Kerja di 1sLabs - ${candidate.position_name || 'Kandidat'}`,
        htmlContent: `
          <p>Halo <strong>${candidate.full_name}</strong>,</p>
          <p>Kabar baik! Anda lolos ke tahap wawancara untuk posisi <strong>${candidate.position_name || 'di 1sLabs'}</strong>.</p>
          <p>Silakan klik tombol di bawah untuk memilih jadwal wawancara yang paling sesuai dengan waktu Anda:</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${schedulingUrl}" style="background: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Pilih Jadwal Interview &rarr;
            </a>
          </p>
          <p>Tautan ini bersifat aman dan akan kedaluwarsa secara otomatis.</p>
          <p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>
        `,
        variables: {
          candidate_name: candidate.full_name,
          position_name: candidate.position_name,
          scheduling_link: schedulingUrl
        }
      });
    }

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'interview_scheduled', 'Undangan Penjadwalan Interview Dikirim', ?, ?, ?, NOW())`,
      [
        candidate.id,
        `Tautan jadwal interview mandiri dikirimkan ke ${candidate.email}.`,
        JSON.stringify({ token, schedulingUrl }),
        req.user.name || 'Admin'
      ]
    );

    return res.json({
      success: true,
      message: 'Undangan interview berhasil dibuat dan dikirim ke kandidat!',
      interview_id: insertRes.insertId,
      scheduling_url: schedulingUrl
    });
  } catch (err) {
    console.error('Error inviting candidate to interview:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat undangan interview.' });
  }
});

/**
 * Confirm interview & dispatch Google Meet link to candidate
 */
router.post('/interviews/:id/confirm', async (req, res) => {
  try {
    const { meeting_link, instructions } = req.body;
    const interviewId = req.params.id;

    if (!meeting_link || !meeting_link.trim()) {
      return res.status(400).json({ success: false, message: 'Tautan Google Meet / meeting link wajib diisi.' });
    }

    const [interview] = await query(
      `SELECT i.*, c.full_name AS candidate_name, c.email AS candidate_email,
              p.name AS position_name
       FROM hr_interviews i
       JOIN hr_candidates c ON i.candidate_id = c.id
       LEFT JOIN hr_positions p ON i.position_id = p.id
       WHERE i.id = ? LIMIT 1`,
      [interviewId]
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Data interview tidak ditemukan.' });
    }

    const cleanLink = meeting_link.trim();
    const cleanInstructions = instructions ? sanitize(instructions) : null;

    // Update Interview Record
    await query(
      `UPDATE hr_interviews 
       SET meeting_link = ?, instructions = ?, status = 'confirmed', updated_at = NOW() 
       WHERE id = ?`,
      [cleanLink, cleanInstructions, interviewId]
    );

    // Send Branded Confirmation Email via hr@1slabs.my.id
    const confirmSubject = `Konfirmasi Jadwal Interview: ${interview.position_name || '1sLabs'} - 1sLabs`;
    const confirmBody = `
      <p>Halo <strong>${interview.candidate_name}</strong>,</p>
      <p>Jadwal interview Anda untuk posisi <strong>${interview.position_name || 'di 1sLabs'}</strong> telah resmi dikonfirmasi dengan rincian sebagai berikut:</p>
      
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 18px 22px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;">📅 <strong>Tanggal:</strong> ${interview.interview_date}</p>
        <p style="margin: 6px 0; font-size: 14px;">⏰ <strong>Waktu:</strong> ${interview.interview_time} (${interview.timezone})</p>
        <p style="margin: 6px 0; font-size: 14px;">💻 <strong>Platform:</strong> ${interview.meeting_platform || 'Google Meet'}</p>
        <p style="margin: 6px 0; font-size: 14px;">🔗 <strong>Meeting Link:</strong> <a href="${cleanLink}" target="_blank" style="color: #2563eb; text-decoration: underline;">${cleanLink}</a></p>
      </div>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${cleanLink}" target="_blank" style="background: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          Buka Ruang Google Meet &rarr;
        </a>
      </p>

      ${cleanInstructions ? `<div style="background-color: #f4f4f5; padding: 14px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0; font-size: 13px;"><strong>Instruksi Tambahan:</strong><br>${cleanInstructions}</p></div>` : ''}

      <p style="font-size: 13px; color: #52525b;">Mohon hadir 5 menit sebelum jadwal wawancara dimulai. Apabila ada kendala, Anda dapat langsung membalas email ini.</p>
      <p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>
    `;

    await sendHREmail({
      candidateId: interview.candidate_id,
      to: interview.candidate_email,
      toName: interview.candidate_name,
      subject: confirmSubject,
      htmlContent: confirmBody
    });

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'interview_confirmed', 'Interview Dikonfirmasi & Link Terkirim', ?, ?, ?, NOW())`,
      [
        interview.candidate_id,
        `Link pertemuan (${cleanLink}) dan konfirmasi resmi dikirimkan via email ke ${interview.candidate_email}.`,
        JSON.stringify({ interviewId, meetingLink: cleanLink, date: interview.interview_date, time: interview.interview_time }),
        req.user.name || 'Admin'
      ]
    );

    return res.json({
      success: true,
      message: 'Interview berhasil dikonfirmasi dan email link Google Meet telah dikirim ke kandidat!'
    });
  } catch (err) {
    console.error('Error confirming interview:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengonfirmasi interview.' });
  }
});

router.post('/interviews/:id/reschedule', async (req, res) => {
  try {
    const { interview_date, interview_time, meeting_link, reason } = req.body;
    const interviewId = req.params.id;

    const [interview] = await query(
      `SELECT i.*, c.full_name AS candidate_name, c.email AS candidate_email, p.name AS position_name
       FROM hr_interviews i
       JOIN hr_candidates c ON i.candidate_id = c.id
       LEFT JOIN hr_positions p ON i.position_id = p.id
       WHERE i.id = ?`,
      [interviewId]
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Data interview tidak ditemukan.' });
    }

    await query(
      `UPDATE hr_interviews 
       SET interview_date = ?, interview_time = ?, meeting_link = ?,
           status = 'rescheduled', updated_at = NOW() 
       WHERE id = ?`,
      [interview_date, interview_time, meeting_link || interview.meeting_link, interviewId]
    );

    // Send Reschedule Email
    const emailSubj = `Pemberitahuan Perubahan Jadwal Interview: ${interview.position_name || '1sLabs'} - 1sLabs`;
    const emailBody = `
      <p>Halo <strong>${interview.candidate_name}</strong>,</p>
      <p>Jadwal interview Anda untuk posisi <strong>${interview.position_name || 'di 1sLabs'}</strong> telah dijadwalkan ulang ke:</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 4px 0;">📅 <strong>Tanggal Baru:</strong> ${interview_date}</p>
        <p style="margin: 4px 0;">⏰ <strong>Waktu Baru:</strong> ${interview_time} (${interview.timezone})</p>
        ${meeting_link ? `<p style="margin: 4px 0;">🔗 <strong>Meeting Link:</strong> <a href="${meeting_link}" target="_blank">${meeting_link}</a></p>` : ''}
      </div>
      ${reason ? `<p><strong>Catatan:</strong> ${sanitize(reason)}</p>` : ''}
      <p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>
    `;

    await sendHREmail({
      candidateId: interview.candidate_id,
      to: interview.candidate_email,
      toName: interview.candidate_name,
      subject: emailSubj,
      htmlContent: emailBody
    });

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'interview_rescheduled', 'Jadwal Interview Diubah', ?, ?, ?, NOW())`,
      [
        interview.candidate_id,
        `Jadwal diubah ke ${interview_date} ${interview_time}. Email pemberitahuan terkirim ke ${interview.candidate_email}.`,
        JSON.stringify({ interviewDate: interview_date, interviewTime: interview_time, reason }),
        req.user.name || 'Admin'
      ]
    );

    return res.json({ success: true, message: 'Jadwal interview berhasil diubah dan notifikasi terkirim ke kandidat.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menjadwal ulang interview.' });
  }
});

router.post('/interviews/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const interviewId = req.params.id;

    const [interview] = await query(
      `SELECT i.*, c.full_name AS candidate_name, c.email AS candidate_email, p.name AS position_name
       FROM hr_interviews i
       LEFT JOIN hr_candidates c ON i.candidate_id = c.id
       LEFT JOIN hr_positions p ON i.position_id = p.id
       WHERE i.id = ?`,
      [interviewId]
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Data interview tidak ditemukan.' });
    }

    // 1. Release slot if booked
    if (interview.slot_id) {
      try {
        const [cnt] = await query(
          `SELECT COUNT(*) AS active_count FROM hr_interviews 
           WHERE slot_id = ? AND id != ? AND status NOT IN ('cancelled', 'rescheduled')`,
          [interview.slot_id, interviewId]
        );
        const [slotInfo] = await query('SELECT max_capacity FROM hr_interview_slots WHERE id = ?', [interview.slot_id]);
        const maxCap = slotInfo ? (slotInfo.max_capacity || 1) : 1;
        const activeCount = cnt ? (cnt.active_count || 0) : 0;
        if (activeCount < maxCap) {
          await query('UPDATE hr_interview_slots SET is_booked = 0 WHERE id = ?', [interview.slot_id]);
        }
      } catch (slotErr) {
        console.warn('[HR Interview] Error updating slot capacity on cancellation:', slotErr.message);
      }
    }

    // 2. Update Interview Status
    await query(
      `UPDATE hr_interviews 
       SET status = 'cancelled', queue_status = 'cancelled', cancellation_reason = ?, updated_at = NOW() 
       WHERE id = ?`,
      [reason ? sanitize(reason) : 'Dibatalkan oleh Admin', interviewId]
    );

    // 3. Send Cancellation Email (async background, non-blocking)
    if (interview.candidate_email) {
      sendHREmail({
        candidateId: interview.candidate_id,
        to: interview.candidate_email,
        toName: interview.candidate_name,
        subject: `Pembatalan Jadwal Interview - 1sLabs`,
        htmlContent: `
          <p>Halo <strong>${interview.candidate_name || 'Kandidat'}</strong>,</p>
          <p>Kami memberitahukan bahwa sesi interview yang semula dijadwalkan pada ${interview.interview_date || '-'} pukul ${interview.interview_time || '-'} telah dibatalkan.</p>
          ${reason ? `<p><strong>Alasan:</strong> ${sanitize(reason)}</p>` : ''}
          <p>Tim HR kami akan menghubungi Anda kembali untuk informasi lebih lanjut.</p>
          <p>Salam hangat,<br><strong>Tim Rekrutmen 1sLabs</strong></p>
        `
      }).catch(mailErr => {
        console.warn('[HR Interview] Failed to send async cancellation email:', mailErr.message);
      });
    }

    // 4. Log Activity (graceful, non-blocking)
    if (interview.candidate_id) {
      try {
        await query(
          `INSERT INTO hr_candidate_activities 
           (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
           VALUES (?, 'interview_cancelled', 'Interview Dibatalkan', ?, ?, ?, NOW())`,
          [
            interview.candidate_id,
            `Sesi interview dibatalkan. Alasan: ${reason || 'Tidak ada keterangan'}.`,
            JSON.stringify({ reason }),
            req.user?.name || req.user?.email || 'Admin'
          ]
        );
      } catch (actErr) {
        console.warn('[HR Interview] Failed to log cancellation activity:', actErr.message);
      }
    }

    return res.json({ success: true, message: 'Interview berhasil dibatalkan.' });
  } catch (err) {
    console.error('Error cancelling interview:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal membatalkan interview.' });
  }
});

router.patch('/interviews/:id/start-session', async (req, res) => {
  try {
    const interviewId = req.params.id;
    const [interview] = await query('SELECT candidate_id, slot_id, queue_number FROM hr_interviews WHERE id = ?', [interviewId]);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Data interview tidak ditemukan.' });
    }

    await query(
      `UPDATE hr_interviews 
       SET status = 'in_progress', queue_status = 'in_progress', updated_at = NOW() 
       WHERE id = ?`,
      [interviewId]
    );

    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'status_change', 'Sesi Interview Dimulai (In Progress)', 'Pewawancara telah memulai sesi wawancara di Google Meet.', '{}', ?, NOW())`,
      [interview.candidate_id, req.user?.name || 'Admin']
    );

    return res.json({ success: true, message: 'Sesi interview berhasil dimulai (In Progress)!' });
  } catch (err) {
    console.error('Error starting interview session:', err);
    return res.status(500).json({ success: false, message: 'Gagal memulai sesi interview.' });
  }
});

router.patch('/interviews/:id/complete', async (req, res) => {
  try {
    const { interviewer_notes, rating, advance_candidate_status = true } = req.body;
    const interviewId = req.params.id;

    const [interview] = await query('SELECT candidate_id FROM hr_interviews WHERE id = ?', [interviewId]);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Data interview tidak ditemukan.' });
    }

    await query(
      `UPDATE hr_interviews 
       SET status = 'completed', queue_status = 'completed', interviewer_notes = ?, rating = ?, updated_at = NOW() 
       WHERE id = ?`,
      [interviewer_notes ? sanitize(interviewer_notes) : null, rating || null, interviewId]
    );

    if (advance_candidate_status) {
      await query(
        `UPDATE hr_candidates 
         SET recruitment_status = 'interview_completed', rating = ?, last_activity_at = NOW() 
         WHERE id = ?`,
        [rating || null, interview.candidate_id]
      );
    }

    // Log Activity
    await query(
      `INSERT INTO hr_candidate_activities 
       (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
       VALUES (?, 'status_change', 'Interview Selesai Dilaksanakan', ?, ?, ?, NOW())`,
      [
        interview.candidate_id,
        `Sesi wawancara telah selesai dilaksanakan. Evaluasi dan catatan disimpan oleh ${req.user.name || 'Admin'}.`,
        JSON.stringify({ rating, notes: interviewer_notes }),
        req.user.name || 'Admin'
      ]
    );

    return res.json({ success: true, message: 'Interview ditandai selesai!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menandai interview selesai.' });
  }
});

module.exports = router;

