const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireAdmin, requireAdminOrMarketing } = require('../middleware/auth');
const { sendEmail, wrapHtmlEmail } = require('../services/email.service');
const { logActivity } = require('../utils/activityLogger');

// Basic sanitize
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/[<>]/g, '')
    .trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// 1. PUBLIC: POST /api/meetings/schedule
// ==========================================
router.post('/schedule', async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      meeting_date,
      meeting_time,
      platform = 'Google Meet',
      notes,
      source_campaign_id
    } = req.body;

    if (!contact_person || typeof contact_person !== 'string' || contact_person.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nama kontak person wajib diisi (minimal 2 karakter).'
      });
    }

    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Alamat email tidak valid.'
      });
    }

    if (!meeting_date || !/^\d{4}-\d{2}-\d{2}$/.test(meeting_date.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal meeting tidak valid (gunakan format YYYY-MM-DD).'
      });
    }

    if (!meeting_time || typeof meeting_time !== 'string' || meeting_time.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Jam meeting wajib dipilih.'
      });
    }

    const cleanCompany = company_name ? sanitize(company_name).slice(0, 190) : null;
    const cleanContact = sanitize(contact_person).slice(0, 190);
    const cleanEmail = email.trim().toLowerCase().slice(0, 190);
    const cleanPhone = phone ? sanitize(phone).slice(0, 45) : null;
    const cleanDate = meeting_date.trim();
    const cleanTime = sanitize(meeting_time).slice(0, 50);
    const cleanPlatform = sanitize(platform || 'Google Meet').slice(0, 50);
    const cleanNotes = notes ? sanitize(notes).slice(0, 5000) : null;
    const campaignId = source_campaign_id ? parseInt(source_campaign_id, 10) : null;

    const insertRes = await query(`
      INSERT INTO meeting_schedules (
        company_name, contact_person, email, phone, meeting_date,
        meeting_time, platform, notes, status, source_campaign_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `, [
      cleanCompany, cleanContact, cleanEmail, cleanPhone, cleanDate,
      cleanTime, cleanPlatform, cleanNotes, campaignId
    ]);

    const scheduleId = insertRes && insertRes.insertId ? insertRes.insertId : null;

    // Send async email notification to admin & confirmation to prospect
    (async () => {
      try {
        const adminEmail = process.env.MAIL_ADMIN_RECIPIENT || 'dzikrirabbani2401@gmail.com';
        
        // 1. Admin Email
        const adminContent = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Halo Admin 1sLabs,</p>
            <p>Ada calon klien yang baru saja <strong>menjadwalkan diskusi / online meeting</strong> melalui platform 1sLabs:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; width: 160px; color: #4b5563;">Nama Perusahaan:</td>
                <td style="padding: 8px 0; color: #111827;">${cleanCompany || '(Tidak dicantumkan)'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Contact Person:</td>
                <td style="padding: 8px 0; color: #111827;">${cleanContact}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
                <td style="padding: 8px 0; color: #111827;"><a href="mailto:${cleanEmail}" style="color: #4f46e5;">${cleanEmail}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">No. WhatsApp / HP:</td>
                <td style="padding: 8px 0; color: #111827;">${cleanPhone ? `<a href="https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}" style="color: #059669;">${cleanPhone}</a>` : '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Tanggal Meeting:</td>
                <td style="padding: 8px 0; color: #047857; font-weight: bold;">${cleanDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Waktu / Jam:</td>
                <td style="padding: 8px 0; color: #047857; font-weight: bold;">${cleanTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Platform:</td>
                <td style="padding: 8px 0; color: #111827;">${cleanPlatform}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; vertical-align: top;">Catatan / Feedback:</td>
                <td style="padding: 8px 0; color: #111827; background: #f9fafb; padding: 12px; border-radius: 8px;">${cleanNotes || '-'}</td>
              </tr>
            </table>
            <p style="margin-top: 16px;">Silakan tindak lanjuti jadwal meeting ini di sub-menu <strong>Feedback & Jadwal Meeting</strong> di Admin Dashboard.</p>
          </div>
        `;

        await sendEmail({
          to: adminEmail,
          subject: `[Jadwal Meeting Baru] #${scheduleId} ${cleanCompany ? cleanCompany + ' - ' : ''}${cleanContact} (${cleanDate})`,
          title: 'Pengajuan Jadwal Diskusi Online Baru',
          preheader: `Jadwal meeting baru dari ${cleanContact} (${cleanDate} ${cleanTime})`,
          content: adminContent,
          callToAction: {
            url: `https://1slabs.my.id/admin?tab=feedback`,
            text: 'Buka Menu Feedback di Admin'
          },
          badge: 'New Meeting Alert'
        });

        // 2. Client Confirmation Email
        const clientContent = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Halo <strong>${cleanContact}</strong>${cleanCompany ? ' (' + cleanCompany + ')' : ''},</p>
            <p>Terima kasih telah menjadwalkan sesi diskusi online bersama <strong>1sLabs</strong>. Permintaan meeting Anda telah berhasil kami catat dalam agenda kami:</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Rincian Sesi Diskusi:</strong></p>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d;">
                <li style="margin-bottom: 4px;"><strong>Tanggal:</strong> ${cleanDate}</li>
                <li style="margin-bottom: 4px;"><strong>Waktu:</strong> ${cleanTime}</li>
                <li style="margin-bottom: 4px;"><strong>Platform:</strong> ${cleanPlatform}</li>
              </ul>
            </div>
            <p>Tautan Google Meet / akses meeting online akan kami kirimkan sebelum jadwal sesi dimulai. Tim kami akan mendiskusikan kebutuhan sistem, website, serta arsitektur solusi digital yang paling sesuai untuk bisnis Anda.</p>
            <p>Jika ada penyesuaian jadwal atau pertanyaan mendesak, silakan hubungi Hotline WhatsApp kami di <strong>+62 851-5629-6580</strong>.</p>
          </div>
        `;

        await sendEmail({
          to: cleanEmail,
          subject: `Konfirmasi Jadwal Diskusi Online 1sLabs - ${cleanDate} (${cleanTime})`,
          title: 'Jadwal Diskusi Online Terkonfirmasi',
          preheader: `Sesi diskusi bersama 1sLabs telah dijadwalkan pada ${cleanDate} pukul ${cleanTime}.`,
          content: clientContent,
          callToAction: {
            url: 'https://wa.me/6285156296580?text=Halo%201sLabs%2C%20saya%20ingin%20konfirmasi%20jadwal%20meeting.',
            text: 'Hubungi Kami via WhatsApp'
          },
          badge: 'Meeting Scheduled'
        });
      } catch (err) {
        console.warn('[Meeting schedule notification warning]:', err.message);
      }
    })();

    return res.json({
      success: true,
      message: 'Jadwal diskusi online berhasil dikonfirmasi.',
      scheduleId,
      data: {
        id: scheduleId,
        company_name: cleanCompany,
        contact_person: cleanContact,
        email: cleanEmail,
        phone: cleanPhone,
        meeting_date: cleanDate,
        meeting_time: cleanTime,
        platform: cleanPlatform,
        notes: cleanNotes
      }
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menjadwalkan meeting. Silakan hubungi kami langsung via WhatsApp.'
    });
  }
});

// Also support root POST / on meetings router
router.post('/', (req, res, next) => {
  req.url = '/schedule';
  router.handle(req, res, next);
});

// ==========================================
// 2. ADMIN: GET /api/meetings/admin (List)
// ==========================================
router.get('/admin', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const { status, search, from_date, to_date, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM meeting_schedules WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (from_date) {
      sql += ' AND meeting_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      sql += ' AND meeting_date <= ?';
      params.push(to_date);
    }

    if (search && search.trim()) {
      sql += ' AND (contact_person LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ? OR notes LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY meeting_date ASC, meeting_time ASC, id DESC LIMIT ? OFFSET ?';
    const numLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = Math.max(0, (parseInt(page, 10) - 1) * numLimit);
    params.push(numLimit, offset);

    const meetings = await query(sql, params);

    // Summary stats
    const [counts] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN meeting_date = CURDATE() THEN 1 ELSE 0 END) as today_meetings
      FROM meeting_schedules
    `);

    return res.json({
      success: true,
      meetings,
      stats: counts || { total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, today_meetings: 0 }
    });
  } catch (error) {
    console.error('Admin list meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar jadwal meeting.'
    });
  }
});

// ==========================================
// 3. ADMIN: PATCH /api/meetings/admin/:id
// ==========================================
router.patch('/admin/:id', requireAuth, requireAdminOrMarketing, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meeting_date, meeting_time, platform, admin_notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (meeting_date) {
      updates.push('meeting_date = ?');
      params.push(meeting_date);
    }
    if (meeting_time) {
      updates.push('meeting_time = ?');
      params.push(meeting_time);
    }
    if (platform) {
      updates.push('platform = ?');
      params.push(platform);
    }
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diperbarui.' });
    }

    params.push(id);
    await query(`UPDATE meeting_schedules SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    return res.json({
      success: true,
      message: 'Data jadwal meeting berhasil diperbarui.'
    });
  } catch (error) {
    console.error('Admin update meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status meeting.'
    });
  }
});

// ==========================================
// 4. ADMIN: DELETE /api/meetings/admin/:id
// ==========================================
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM meeting_schedules WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Jadwal meeting berhasil dihapus.'
    });
  } catch (error) {
    console.error('Admin delete meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus jadwal meeting.'
    });
  }
});

module.exports = router;

