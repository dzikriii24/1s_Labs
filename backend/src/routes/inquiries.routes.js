const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendMail } = require('../services/email.service');
const { logActivity } = require('../utils/activityLogger');

// In-memory rate limiting map for contact submissions
const ipSubmissionMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;

  const records = ipSubmissionMap.get(ip) || [];
  const validRecords = records.filter(ts => now - ts < windowMs);

  if (validRecords.length >= maxRequests) {
    ipSubmissionMap.set(ip, validRecords);
    return true;
  }

  validRecords.push(now);
  ipSubmissionMap.set(ip, validRecords);
  return false;
}

// Clean old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  for (const [ip, records] of ipSubmissionMap.entries()) {
    const valid = records.filter(ts => now - ts < windowMs);
    if (valid.length === 0) {
      ipSubmissionMap.delete(ip);
    } else {
      ipSubmissionMap.set(ip, valid);
    }
  }
}, 60 * 60 * 1000);

// Simple sanitization helper
function sanitize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// 1. PUBLIC: POST /inquiries - Submit Inquiry
// ==========================================
router.post('/', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(ip)) {
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu beberapa menit sebelum mengirim pesan lagi.'
      });
    }

    const {
      name,
      email,
      phone,
      company,
      inquiry_type = 'consultation',
      service_interested,
      current_website_url,
      budget_range,
      message
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap wajib diisi (minimal 2 karakter).'
      });
    }

    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Alamat email tidak valid.'
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Pesan kebutuhan atau rincian proyek wajib diisi (minimal 5 karakter).'
      });
    }

    const validTypes = ['consultation', 'website_development', 'website_maintenance', 'custom_software', 'hosting', 'other'];
    const chosenType = validTypes.includes(inquiry_type) ? inquiry_type : 'consultation';

    const cleanName = sanitize(name).slice(0, 190);
    const cleanEmail = email.trim().toLowerCase().slice(0, 190);
    const cleanPhone = phone ? sanitize(phone).slice(0, 45) : null;
    const cleanCompany = company ? sanitize(company).slice(0, 190) : null;
    const cleanService = service_interested ? sanitize(service_interested).slice(0, 190) : null;
    const cleanUrl = current_website_url ? sanitize(current_website_url).slice(0, 250) : null;
    const cleanBudget = budget_range ? sanitize(budget_range).slice(0, 95) : null;
    const cleanMessage = sanitize(message).slice(0, 5000);

    const insertRes = await query(`
      INSERT INTO contact_inquiries (
        inquiry_type, name, email, phone, company, service_interested,
        current_website_url, budget_range, message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `, [
      chosenType, cleanName, cleanEmail, cleanPhone, cleanCompany, cleanService,
      cleanUrl, cleanBudget, cleanMessage
    ]);

    const inquiryId = insertRes && insertRes.insertId ? insertRes.insertId : null;

    // Async notify admin via email
    try {
      const adminEmail = process.env.MAIL_ADMIN_RECIPIENT || 'dzikrirabbani2401@gmail.com';
      const typeLabels = {
        consultation: 'Konsultasi IT Gratis',
        website_development: 'Jasa Pembuatan Website',
        website_maintenance: 'Annual Website Maintenance',
        custom_software: 'Custom Web Application / Software',
        hosting: 'Cloud Hosting & Domain',
        other: 'Inquiry Umum'
      };

      const emailSubject = `[Inquiry Baru] ${typeLabels[chosenType] || chosenType} dari ${cleanName}`;
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">Inquiry Pelanggan Baru #INQ-${inquiryId}</h2>
          <p style="color: #4b5563; font-size: 14px;">Ada calon pelanggan yang baru saja mengirimkan formulir inquiry/konsultasi di platform 1sLabs:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 140px;">Jenis Layanan:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #111827;">${typeLabels[chosenType] || chosenType}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Nama Pengirim:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #111827;">${cleanName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827;"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Nomor HP / WA:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827;">${cleanPhone ? `<a href="https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}">${cleanPhone}</a>` : '-'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Perusahaan:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827;">${cleanCompany || '-'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Website Existing:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827;">${cleanUrl || '-'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Estimasi Budget:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827;">${cleanBudget || '-'}</td></tr>
          </table>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; color: #374151; white-space: pre-wrap;">${cleanMessage}</p>
          </div>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 25px;">Pesan otomatis dari Platform 1sLabs Engineering.</p>
        </div>
      `;

      sendMail({
        to: adminEmail,
        subject: emailSubject,
        templateName: 'new_inquiry_admin',
        html: emailHtml,
        text: `Inquiry baru dari ${cleanName} (${cleanEmail}): ${cleanMessage}`,
        metadata: { inquiryId, chosenType, cleanEmail }
      }).catch(mailErr => console.warn('[inquiries email warning]:', mailErr.message));
    } catch (err) {
      console.warn('[inquiry email notify err]:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Inquiry Anda berhasil dikirimkan. Tim konsultan & engineer 1sLabs akan segera menghubungi Anda.',
      inquiry_id: inquiryId
    });
  } catch (error) {
    console.error('Submit inquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirimkan inquiry. Silakan hubungi kami via WhatsApp.'
    });
  }
});

// ==========================================
// 2. ADMIN: GET /inquiries - List Inquiries
// ==========================================
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM contact_inquiries WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      sql += ' AND inquiry_type = ?';
      params.push(type);
    }

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ? OR message LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const numLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = Math.max(0, (parseInt(page, 10) - 1) * numLimit);
    params.push(numLimit, offset);

    const inquiries = await query(sql, params);

    // Get count for pagination
    const [countRes] = await query('SELECT COUNT(*) as total FROM contact_inquiries');

    return res.json({
      success: true,
      inquiries,
      total: countRes?.total || 0,
      page: parseInt(page, 10),
      limit: numLimit
    });
  } catch (error) {
    console.error('Admin list inquiries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar inquiry pelanggan.'
    });
  }
});

// ==========================================
// 3. ADMIN: PATCH /inquiries/:id - Update Status
// ==========================================
router.patch('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const validStatuses = ['new', 'contacted', 'in_progress', 'converted', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inquiry tidak valid.'
      });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (typeof admin_notes === 'string') {
      updates.push('admin_notes = ?');
      params.push(admin_notes.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada perubahan data.'
      });
    }

    params.push(id);
    await query(`UPDATE contact_inquiries SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    logActivity({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'inquiry_updated',
      target: `Inquiry #${id}`,
      result: 'success',
      req
    });

    return res.json({
      success: true,
      message: 'Status inquiry berhasil diperbarui.'
    });
  } catch (error) {
    console.error('Admin update inquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status inquiry.'
    });
  }
});

// ==========================================
// 4. ADMIN: DELETE /inquiries/:id - Delete
// ==========================================
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM contact_inquiries WHERE id = ?', [id]);

    logActivity({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'inquiry_deleted',
      target: `Inquiry #${id}`,
      result: 'success',
      req
    });

    return res.json({
      success: true,
      message: 'Inquiry berhasil dihapus.'
    });
  } catch (error) {
    console.error('Admin delete inquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus inquiry.'
    });
  }
});

module.exports = router;

