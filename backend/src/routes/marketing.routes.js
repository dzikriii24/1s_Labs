const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth, requireAdmin, requireAdminOrMarketing } = require('../middleware/auth');
const { getDailyQuotaStatus, addToSuppressionList, isSuppressed, sendMarketingEmail, verifyUnsubscribeToken } = require('../services/marketing/marketingEmail.service');
const { runDiscoveryJob } = require('../services/marketing/discoveryScheduler.service');
const { extractAndEnrichBusiness, classifyEmailResponse, callGeminiApi, recoverSmallBusinessContact } = require('../services/marketing/gemini.service');
const { recoverCompanyContact, runBatchContactRecovery, getContactRecoveryStats } = require('../services/marketing/contactRecovery.service');
const { auditCompanyWebsite } = require('../services/marketing/websiteAudit.service');
const { normalizeBusinessName, normalizeDomain, normalizePhone, findPotentialDuplicate } = require('../services/marketing/deduplication.service');

// =====================================================
// PUBLIC UNPROTECTED ENDPOINT: Unsubscribe Handler
// =====================================================
router.get('/unsubscribe', async (req, res) => {
  const { email, token } = req.query;
  if (!email || !token) {
    return res.status(400).send('<h3>Permintaan tidak valid: Parameter email atau token hilang.</h3>');
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return res.status(403).send('<h3>Token verifikasi unsubscribe tidak valid atau telah kedaluwarsa.</h3>');
  }

  try {
    await addToSuppressionList(email, 'unsubscribe', 'Unsubscribed via direct link in email', 'user_optout');
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Berhasil Berhenti Berlangganan - 1sLabs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
          h2 { color: #fff; margin-bottom: 12px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Preferensi Diperbarui</div>
          <h2>Berhenti Berlangganan Berhasil</h2>
          <p>Alamat email <strong>${email}</strong> telah kami hapus dari daftar pengiriman penawaran 1sLabs. Anda tidak akan menerima email outreach berikutnya dari sistem kami.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #71717a;">Terima kasih atas perhatian Anda. 1sLabs menghormati privasi dan pilihan komunikasi Anda.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send(`<h3>Terjadi kesalahan: ${err.message}</h3>`);
  }
});

// =====================================================
// ALL FOLLOWING ROUTES REQUIRE ADMIN PRIVILEGES
// =====================================================
router.use(requireAuth, requireAdminOrMarketing);

// -----------------------------------------------------
// 1. MARKETING OVERVIEW & KPIS
// -----------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const quota = await getDailyQuotaStatus();

    // Query core counts
    const countsRows = await query(`
      SELECT 
        COUNT(*) as total_prospects,
        SUM(CASE WHEN business_scale IN ('Micro Business', 'Small Business', 'Local Business', 'Home Business', 'Online Business', 'Growing Business') THEN 1 ELSE 0 END) as total_small_business,
        SUM(CASE WHEN is_international = 0 OR country = 'Indonesia' THEN 1 ELSE 0 END) as total_indonesia,
        SUM(CASE WHEN is_international = 1 OR (country IS NOT NULL AND country != 'Indonesia') THEN 1 ELSE 0 END) as total_international,
        SUM(CASE WHEN category = 'UMKM' THEN 1 ELSE 0 END) as total_umkm,
        SUM(CASE WHEN category IN ('Coffee Shop', 'Cafe') THEN 1 ELSE 0 END) as total_coffee_shops,
        SUM(CASE WHEN category IN ('Restaurant', 'Kuliner') THEN 1 ELSE 0 END) as total_restaurants,
        SUM(CASE WHEN (email IS NULL OR email = '') AND (phone IS NULL OR phone = '') AND (whatsapp_number IS NULL OR whatsapp_number = '') AND (website_url IS NULL OR website_url = '') THEN 1 ELSE 0 END) as without_contacts,
        SUM(CASE WHEN whatsapp_number IS NOT NULL AND whatsapp_number != '' THEN 1 ELSE 0 END) as with_whatsapp_count,
        SUM(CASE WHEN instagram_url IS NOT NULL AND instagram_url != '' THEN 1 ELSE 0 END) as with_instagram_count,
        SUM(CASE WHEN category = 'Company' THEN 1 ELSE 0 END) as total_companies,
        SUM(CASE WHEN DATE(first_discovered_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN first_discovered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week,
        SUM(CASE WHEN first_discovered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month,
        SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) as with_email_count,
        SUM(CASE WHEN outreach_eligibility = 'eligible' OR outreach_eligibility = '1' THEN 1 ELSE 0 END) as outreach_eligible_count,
        SUM(CASE WHEN lead_score >= 70 THEN 1 ELSE 0 END) as high_potential_count,
        SUM(CASE WHEN status = 'Responded' THEN 1 ELSE 0 END) as responded_count,
        SUM(CASE WHEN status = 'Interested' THEN 1 ELSE 0 END) as interested_count,
        SUM(CASE WHEN status = 'Consultation Scheduled' THEN 1 ELSE 0 END) as consultation_scheduled_count,
        SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted_count
      FROM marketing_companies
      WHERE is_deleted = 0
    `);
    const counts = countsRows[0] || {};

    // Email metrics
    const emailRows = await query(`
      SELECT 
        COUNT(*) as total_sent_all_time,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sent,
        SUM(CASE WHEN DATE(sent_at) = CURDATE() AND status = 'sent' THEN 1 ELSE 0 END) as sent_today
      FROM marketing_email_logs
    `);
    const emailMetrics = emailRows[0] || {};

    // Today's Discovery list (recent 6)
    const todaysDiscovery = await query(`
      SELECT id, name, category, industry, city, province, website_url, email, phone, lead_score, lead_grade, outreach_eligibility, first_discovered_at
      FROM marketing_companies 
      WHERE DATE(first_discovered_at) = CURDATE() 
      ORDER BY id DESC LIMIT 6
    `);

    // AI Activity logs (recent 8)
    const aiActivities = await query(`
      SELECT id, model, purpose, status, latency_ms, input_snapshot, created_at
      FROM marketing_ai_logs 
      ORDER BY id DESC LIMIT 8
    `);

    // Charts Data:
    // 1. Discovery by source
    const bySource = await query(`
      SELECT primary_source_name as source, COUNT(*) as count 
      FROM marketing_companies 
      GROUP BY primary_source_name 
      ORDER BY count DESC LIMIT 6
    `);

    // 2. Sector distribution
    const bySector = await query(`
      SELECT COALESCE(industry, 'General') as sector, COUNT(*) as count 
      FROM marketing_companies 
      GROUP BY industry 
      ORDER BY count DESC LIMIT 6
    `);

    // 3. Province distribution
    const byProvince = await query(`
      SELECT COALESCE(province, 'Lainnya') as province, COUNT(*) as count 
      FROM marketing_companies 
      GROUP BY province 
      ORDER BY count DESC LIMIT 6
    `);

    // 4. Growth per day (last 7 days)
    const dailyGrowth = await query(`
      SELECT DATE(first_discovered_at) as date, COUNT(*) as count 
      FROM marketing_companies 
      WHERE first_discovered_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(first_discovered_at) 
      ORDER BY date ASC
    `);

    // 5. Funnel stages
    const funnel = [
      { stage: 'Discovered', count: counts.total_prospects || 0 },
      { stage: 'Outreach Eligible', count: counts.outreach_eligible_count || 0 },
      { stage: 'Contacted', count: (emailMetrics.successful_sent || 0) },
      { stage: 'Responded', count: counts.responded_count || 0 },
      { stage: 'Interested', count: counts.interested_count || 0 },
      { stage: 'Consultation', count: counts.consultation_scheduled_count || 0 },
      { stage: 'Converted', count: counts.converted_count || 0 }
    ];

    return res.json({
      success: true,
      stats: {
        total_prospects: counts.total_prospects || 0,
        total_umkm: counts.total_umkm || 0,
        total_companies: counts.total_companies || 0,
        new_today: counts.new_today || 0,
        new_this_week: counts.new_this_week || 0,
        new_this_month: counts.new_this_month || 0,
        verified_count: counts.verified_count || 0,
        with_email_count: counts.with_email_count || 0,
        outreach_eligible_count: counts.outreach_eligible_count || 0,
        emails_sent_today: quota.sent_count,
        remaining_quota_today: quota.remaining_quota,
        max_daily_quota: quota.max_limit,
        total_sent: emailMetrics.successful_sent || 0,
        total_failed: emailMetrics.failed_sent || 0,
        total_responded: counts.responded_count || 0,
        total_interested: counts.interested_count || 0,
        total_consultations: counts.consultation_scheduled_count || 0,
        total_converted: counts.converted_count || 0
      },
      quota,
      todaysDiscovery,
      aiActivities,
      charts: {
        bySource,
        bySector,
        byProvince,
        dailyGrowth,
        funnel
      }
    });
  } catch (err) {
    console.error('Marketing stats error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 2. PROSPECT DATABASE (COMPANIES) — SMALL BUSINESS & INTERNATIONAL
// -----------------------------------------------------
router.get('/companies', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const {
      search,
      category,
      industry,
      province,
      city,
      country,
      scope, // 'indonesia' | 'international' | 'all'
      business_scale, // 'Micro Business' | 'Small Business' | 'Local Business' | 'Home Business' | 'Online Business' | 'Growing Business' | 'Other' | 'Unknown'
      missing_field, // 'no_contacts' | 'no_email' | 'no_phone' | 'no_website' | 'no_whatsapp' | 'no_social' | 'partially_enriched' | 'fully_enriched'
      is_new, // '1' or 'true'
      is_priority,
      is_archived,
      is_deleted,
      status,
      outreach_eligibility,
      lead_grade,
      has_website,
      sortBy = 'id',
      sortDir = 'DESC'
    } = req.query;

    const whereClauses = ['1=1'];
    const params = [];

    // Default exclude soft-deleted unless explicitly requested
    if (is_deleted === '1' || is_deleted === 'true') {
      whereClauses.push('is_deleted = 1');
    } else {
      whereClauses.push('is_deleted = 0');
    }

    // Default exclude archived unless requested
    if (is_archived === '1' || is_archived === 'true') {
      whereClauses.push('is_archived = 1');
    } else if (is_archived === '0' || is_archived === 'false') {
      whereClauses.push('is_archived = 0');
    }

    // Scope: Indonesia vs International
    if (scope === 'indonesia') {
      whereClauses.push('(is_international = 0 OR country = "Indonesia")');
    } else if (scope === 'international') {
      whereClauses.push('(is_international = 1 OR (country IS NOT NULL AND country != "Indonesia"))');
    }

    if (country && country !== 'all') {
      whereClauses.push('country = ?');
      params.push(country);
    }

    if (business_scale && business_scale !== 'all') {
      whereClauses.push('business_scale = ?');
      params.push(business_scale);
    }

    if (is_priority !== undefined && is_priority !== '') {
      whereClauses.push('is_priority = ?');
      params.push(is_priority === '1' || is_priority === 'true' ? 1 : 0);
    }

    if (is_new === '1' || is_new === 'true') {
      whereClauses.push("(status = 'New Discovery' OR first_discovered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))");
    }

    // Missing Field filters
    if (missing_field === 'no_contacts') {
      whereClauses.push('id NOT IN (SELECT DISTINCT company_id FROM marketing_contacts)');
    } else if (missing_field === 'no_email') {
      whereClauses.push('(email IS NULL OR email = "")');
    } else if (missing_field === 'no_phone') {
      whereClauses.push('(phone IS NULL OR phone = "") AND (whatsapp_number IS NULL OR whatsapp_number = "")');
    } else if (missing_field === 'no_website') {
      whereClauses.push('(website_url IS NULL OR website_url = "")');
    } else if (missing_field === 'no_whatsapp') {
      whereClauses.push('(whatsapp_number IS NULL OR whatsapp_number = "")');
    } else if (missing_field === 'no_social') {
      whereClauses.push('(instagram_url IS NULL OR instagram_url = "")');
    } else if (missing_field === 'partially_enriched') {
      whereClauses.push('(email IS NULL OR phone IS NULL OR website_url IS NULL)');
    } else if (missing_field === 'fully_enriched') {
      whereClauses.push('(email IS NOT NULL AND email != "" AND website_url IS NOT NULL AND website_url != "")');
    }

    if (search) {
      whereClauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ? OR industry LIKE ? OR country LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q, q, q, q);
    }
    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (industry && industry !== 'all') {
      whereClauses.push('industry = ?');
      params.push(industry);
    }
    if (province && province !== 'all') {
      whereClauses.push('province = ?');
      params.push(province);
    }
    if (city && city !== 'all') {
      whereClauses.push('city = ?');
      params.push(city);
    }
    if (status && status !== 'all') {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (outreach_eligibility && outreach_eligibility !== 'all') {
      whereClauses.push('outreach_eligibility = ?');
      params.push(outreach_eligibility);
    }
    if (lead_grade && lead_grade !== 'all') {
      whereClauses.push('lead_grade = ?');
      params.push(lead_grade);
    }
    if (has_website !== undefined && has_website !== '') {
      whereClauses.push('has_website = ?');
      params.push(has_website === 'true' || has_website === '1' ? 1 : 0);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const [countResult] = await query(`SELECT COUNT(*) as total FROM marketing_companies WHERE ${whereSql}`, params);
    const total = countResult ? countResult.total : 0;

    // Allowed sort columns
    const allowedSort = ['id', 'name', 'category', 'country', 'province', 'city', 'business_scale', 'lead_score', 'first_discovered_at', 'status', 'is_priority'];
    const orderCol = allowedSort.includes(sortBy) ? sortBy : 'id';
    const orderDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const companies = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM marketing_contacts mc WHERE mc.company_id = c.id) as contacts_count
       FROM marketing_companies c
       WHERE ${whereSql} 
       ORDER BY c.is_priority DESC, c.${orderCol} ${orderDir} 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Single Company Details (including Contacts, Audits, Sources)
router.get('/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [company] = await query('SELECT * FROM marketing_companies WHERE id = ?', [id]);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Prospect tidak ditemukan.' });
    }

    const contacts = await query('SELECT * FROM marketing_contacts WHERE company_id = ? ORDER BY is_primary DESC, id ASC', [id]);
    const audits = await query('SELECT * FROM marketing_website_audits WHERE company_id = ? ORDER BY id DESC LIMIT 5', [id]);
    const sources = await query(
      `SELECT cs.*, s.name as source_name, s.source_type 
       FROM marketing_company_sources cs 
       LEFT JOIN marketing_sources s ON cs.source_id = s.id 
       WHERE cs.company_id = ? 
       ORDER BY cs.id DESC`,
      [id]
    );
    const emailLogs = await query('SELECT * FROM marketing_email_logs WHERE company_id = ? ORDER BY id DESC LIMIT 10', [id]);
    const followups = await query('SELECT * FROM marketing_followups WHERE company_id = ? ORDER BY due_date ASC', [id]);

    return res.json({
      success: true,
      company,
      contacts,
      audits,
      sources,
      emailLogs,
      followups
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Create Business (Manual CRUD)
router.post('/companies', async (req, res) => {
  try {
    const {
      name,
      category = 'Small Business',
      business_type = 'Local Business',
      business_scale = 'Small Business',
      industry,
      description,
      country = 'Indonesia',
      province,
      city,
      full_address,
      website_url,
      phone,
      whatsapp_number,
      email,
      instagram_url,
      lead_score = 50,
      status = 'New Discovery',
      outreach_eligibility,
      tags,
      admin_notes,
      is_priority = 0
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Nama bisnis wajib diisi.' });
    }

    const normName = normalizeBusinessName(name);
    const normDomain = website_url ? normalizeDomain(website_url) : null;
    const normPhone = phone ? normalizePhone(phone) : null;
    const isIntl = country && country !== 'Indonesia' ? 1 : 0;

    const insert = await query(
      `INSERT INTO marketing_companies
       (name, normalized_name, category, business_type, business_scale, industry, description, country, is_international, province, city, full_address, website_url, normalized_domain, phone, normalized_phone, whatsapp_number, email, instagram_url, lead_score, status, outreach_eligibility, tags, admin_notes, is_priority, primary_source_name, first_discovered_at, last_discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Manual Admin Entry', NOW(), NOW())`,
      [
        name.trim(),
        normName,
        category,
        business_type,
        business_scale,
        industry || category,
        description || null,
        country,
        isIntl,
        province || null,
        city || null,
        full_address || null,
        website_url || null,
        normDomain,
        phone || null,
        normPhone,
        whatsapp_number || null,
        email || null,
        instagram_url || null,
        lead_score,
        status,
        email ? 1 : 0,
        tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
        admin_notes || null,
        is_priority ? 1 : 0
      ]
    );

    const newId = insert.insertId;

    if (email || phone || whatsapp_number) {
      await query(
        `INSERT INTO marketing_contacts
         (company_id, full_name, position, role_category, email, phone, contact_type, contact_value, confidence_score, source_name, verification_status, outreach_eligible, is_primary)
         VALUES (?, ?, 'Owner / Pengelola', 'Owner', ?, ?, 'person', ?, 1.0, 'Manual Admin Entry', 'Verified', ?, 1)`,
        [newId, name.trim(), email || null, phone || whatsapp_number || null, email || phone || name.trim(), email ? 1 : 0]
      );
    }

    const [created] = await query('SELECT * FROM marketing_companies WHERE id = ?', [newId]);
    return res.json({ success: true, message: 'Bisnis baru berhasil ditambahkan.', data: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update Company
router.put('/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      name,
      category,
      business_type,
      business_scale,
      industry,
      description,
      country,
      is_international,
      province,
      city,
      full_address,
      website_url,
      phone,
      whatsapp_number,
      email,
      instagram_url,
      lead_score,
      lead_grade,
      status,
      outreach_eligibility,
      outreach_ineligible_reason,
      admin_notes,
      tags,
      is_priority,
      is_archived
    } = req.body;

    const normName = name ? normalizeBusinessName(name) : undefined;
    const normDomain = website_url ? normalizeDomain(website_url) : undefined;
    const normPhone = phone ? normalizePhone(phone) : undefined;

    await query(
      `UPDATE marketing_companies 
       SET name = COALESCE(?, name),
           normalized_name = COALESCE(?, normalized_name),
           category = COALESCE(?, category),
           business_type = COALESCE(?, business_type),
           business_scale = COALESCE(?, business_scale),
           industry = COALESCE(?, industry),
           description = COALESCE(?, description),
           country = COALESCE(?, country),
           is_international = COALESCE(?, is_international),
           province = COALESCE(?, province),
           city = COALESCE(?, city),
           full_address = COALESCE(?, full_address),
           website_url = COALESCE(?, website_url),
           normalized_domain = COALESCE(?, normalized_domain),
           phone = COALESCE(?, phone),
           normalized_phone = COALESCE(?, normalized_phone),
           whatsapp_number = COALESCE(?, whatsapp_number),
           email = COALESCE(?, email),
           instagram_url = COALESCE(?, instagram_url),
           lead_score = COALESCE(?, lead_score),
           lead_grade = COALESCE(?, lead_grade),
           status = COALESCE(?, status),
           outreach_eligibility = COALESCE(?, outreach_eligibility),
           outreach_ineligible_reason = COALESCE(?, outreach_ineligible_reason),
           admin_notes = COALESCE(?, admin_notes),
           tags = COALESCE(?, tags),
           is_priority = COALESCE(?, is_priority),
           is_archived = COALESCE(?, is_archived),
           updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        normName,
        category,
        business_type,
        business_scale,
        industry,
        description,
        country,
        is_international !== undefined ? (is_international ? 1 : 0) : undefined,
        province,
        city,
        full_address,
        website_url,
        normDomain,
        phone,
        normPhone,
        whatsapp_number,
        email,
        instagram_url,
        lead_score,
        lead_grade,
        status,
        outreach_eligibility,
        outreach_ineligible_reason,
        admin_notes,
        tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : undefined,
        is_priority !== undefined ? (is_priority ? 1 : 0) : undefined,
        is_archived !== undefined ? (is_archived ? 1 : 0) : undefined,
        id
      ]
    );

    return res.json({ success: true, message: 'Data prospek berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle Priority
router.post('/companies/:id/priority', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('UPDATE marketing_companies SET is_priority = NOT is_priority, updated_at = NOW() WHERE id = ?', [id]);
    const [c] = await query('SELECT id, is_priority FROM marketing_companies WHERE id = ?', [id]);
    return res.json({ success: true, is_priority: !!c.is_priority, message: c.is_priority ? 'Bisnis ditandai sebagai prioritas.' : 'Tanda prioritas dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle Archive
router.post('/companies/:id/archive', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('UPDATE marketing_companies SET is_archived = NOT is_archived, updated_at = NOW() WHERE id = ?', [id]);
    const [c] = await query('SELECT id, is_archived FROM marketing_companies WHERE id = ?', [id]);
    return res.json({ success: true, is_archived: !!c.is_archived, message: c.is_archived ? 'Bisnis berhasil diarsipkan.' : 'Bisnis dipulihkan dari arsip.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Company (Soft delete by default, permanent if query permanent=true)
router.delete('/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      await query('DELETE FROM marketing_companies WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Data prospek berhasil dihapus permanen.' });
    } else {
      await query('UPDATE marketing_companies SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Bisnis berhasil dipindahkan ke tempat sampah (soft delete).' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Restore Soft Deleted Company
router.post('/companies/:id/restore', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('UPDATE marketing_companies SET is_deleted = 0, deleted_at = NULL, updated_at = NOW() WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Bisnis berhasil dipulihkan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Contact Recovery Endpoints
router.get('/recovery/stats', async (req, res) => {
  try {
    const stats = await getContactRecoveryStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/recovery/run', async (req, res) => {
  try {
    const { companyIds = [], filter = 'all', limit = 20 } = req.body || {};
    const result = await runBatchContactRecovery({ companyIds, filter, limit: parseInt(limit, 10) });
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/companies/:id/recover-contact', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await recoverCompanyContact(id);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Multi-Contact CRUD
router.get('/companies/:id/contacts', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const contacts = await query('SELECT * FROM marketing_contacts WHERE company_id = ? ORDER BY is_primary DESC, id ASC', [id]);
    return res.json({ success: true, data: contacts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/companies/:id/contacts', async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    const {
      full_name,
      position,
      role_category = 'Owner',
      email,
      phone,
      channel = 'Direct',
      profile_url,
      contact_type = 'person',
      contact_value,
      confidence_score = 1.0,
      source_name = 'Manual Admin Entry',
      verification_status = 'Verified',
      outreach_eligible,
      notes,
      is_primary = 0
    } = req.body;

    if (!full_name && !email && !phone && !contact_value) {
      return res.status(400).json({ success: false, message: 'Minimal masukkan nama, email, atau nomor kontak.' });
    }

    if (is_primary) {
      await query('UPDATE marketing_contacts SET is_primary = 0 WHERE company_id = ?', [companyId]);
    }

    const insert = await query(
      `INSERT INTO marketing_contacts
       (company_id, full_name, position, role_category, email, phone, channel, profile_url, contact_type, contact_value, confidence_score, source_name, verification_status, outreach_eligible, notes, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        full_name || contact_value || 'Kontak Bisnis',
        position || 'Pengelola',
        role_category,
        email || null,
        phone || null,
        channel,
        profile_url || null,
        contact_type,
        contact_value || email || phone || full_name,
        confidence_score,
        source_name,
        verification_status,
        outreach_eligible !== undefined ? (outreach_eligible ? 1 : 0) : (email ? 1 : 0),
        notes || null,
        is_primary ? 1 : 0
      ]
    );

    if (email || phone) {
      await query(
        `UPDATE marketing_companies 
         SET email = COALESCE(email, ?),
             phone = COALESCE(phone, ?),
             outreach_eligibility = CASE WHEN email IS NOT NULL OR ? IS NOT NULL THEN 1 ELSE outreach_eligibility END
         WHERE id = ?`,
        [email || null, phone || null, email || null, companyId]
      );
    }

    const [created] = await query('SELECT * FROM marketing_contacts WHERE id = ?', [insert.insertId]);
    return res.json({ success: true, message: 'Kontak berhasil ditambahkan.', data: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId, 10);
    const {
      full_name,
      position,
      role_category,
      email,
      phone,
      channel,
      profile_url,
      contact_type,
      contact_value,
      confidence_score,
      source_name,
      verification_status,
      outreach_eligible,
      notes,
      is_primary
    } = req.body;

    await query(
      `UPDATE marketing_contacts
       SET full_name = COALESCE(?, full_name),
           position = COALESCE(?, position),
           role_category = COALESCE(?, role_category),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           channel = COALESCE(?, channel),
           profile_url = COALESCE(?, profile_url),
           contact_type = COALESCE(?, contact_type),
           contact_value = COALESCE(?, contact_value),
           confidence_score = COALESCE(?, confidence_score),
           source_name = COALESCE(?, source_name),
           verification_status = COALESCE(?, verification_status),
           outreach_eligible = COALESCE(?, outreach_eligible),
           notes = COALESCE(?, notes),
           is_primary = COALESCE(?, is_primary),
           updated_at = NOW()
       WHERE id = ?`,
      [
        full_name, position, role_category, email, phone, channel, profile_url,
        contact_type, contact_value, confidence_score, source_name, verification_status,
        outreach_eligible, notes, is_primary, contactId
      ]
    );

    return res.json({ success: true, message: 'Data kontak berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId, 10);
    await query('DELETE FROM marketing_contacts WHERE id = ?', [contactId]);
    return res.json({ success: true, message: 'Kontak berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/contacts/:contactId/primary', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId, 10);
    const [c] = await query('SELECT company_id, email, phone FROM marketing_contacts WHERE id = ?', [contactId]);
    if (!c) return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });

    await query('UPDATE marketing_contacts SET is_primary = 0 WHERE company_id = ?', [c.company_id]);
    await query('UPDATE marketing_contacts SET is_primary = 1 WHERE id = ?', [contactId]);

    if (c.email) {
      await query('UPDATE marketing_companies SET email = ?, outreach_eligibility = 1 WHERE id = ?', [c.email, c.company_id]);
    }
    if (c.phone) {
      await query('UPDATE marketing_companies SET phone = ? WHERE id = ?', [c.phone, c.company_id]);
    }

    return res.json({ success: true, message: 'Kontak utama berhasil ditetapkan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk Import Companies (from CSV / XLSX)
router.post('/companies/import', async (req, res) => {
  try {
    const { rows = [], defaultCategory = 'Small Business', defaultScale = 'Small Business' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Data baris import kosong.' });
    }

    let imported = 0;
    let duplicates = 0;
    const errors = [];

    for (const r of rows) {
      const name = r.name || r['Nama Bisnis'] || r['Business Name'];
      if (!name || String(name).trim().length < 2) continue;

      const website = r.website_url || r.website || r['Website'];
      const phone = r.phone || r['Telepon'] || r['Phone'] || r['WhatsApp'];
      const email = r.email || r['Email'];
      const city = r.city || r['Kota'] || r['City'];
      const province = r.province || r['Provinsi'] || r['Province'];
      const category = r.category || r['Kategori'] || defaultCategory;
      const scale = r.business_scale || r['Skala'] || defaultScale;
      const country = r.country || r['Negara'] || 'Indonesia';

      const dup = await findPotentialDuplicate({ name, website_url: website, phone, email, city, province });
      if (dup.isDuplicate && dup.confidence === 'HIGH') {
        duplicates++;
        continue;
      }

      try {
        const normName = normalizeBusinessName(name);
        const normDomain = website ? normalizeDomain(website) : null;
        const normPhone = phone ? normalizePhone(phone) : null;
        const isIntl = country && country !== 'Indonesia' ? 1 : 0;

        const insert = await query(
          `INSERT INTO marketing_companies
           (name, normalized_name, category, business_type, business_scale, country, is_international, province, city, website_url, normalized_domain, phone, normalized_phone, email, lead_score, status, outreach_eligibility, primary_source_name, first_discovered_at, last_discovered_at)
           VALUES (?, ?, ?, 'Local Business', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 'New Discovery', ?, 'Bulk Import', NOW(), NOW())`,
          [
            name.trim(),
            normName,
            category,
            scale,
            country,
            isIntl,
            province || null,
            city || null,
            website || null,
            normDomain,
            phone || null,
            normPhone,
            email || null,
            email ? 1 : 0
          ]
        );

        if (email || phone) {
          await query(
            `INSERT INTO marketing_contacts
             (company_id, full_name, position, role_category, email, phone, contact_type, contact_value, confidence_score, source_name, verification_status, outreach_eligible, is_primary)
             VALUES (?, ?, 'Owner / Pengelola', 'Owner', ?, ?, 'person', ?, 0.9, 'Bulk Import', 'Verified', ?, 1)`,
            [insert.insertId, name.trim(), email || null, phone || null, email || phone || name.trim(), email ? 1 : 0]
          );
        }

        imported++;
      } catch (rowErr) {
        errors.push({ name, error: rowErr.message });
      }
    }

    return res.json({
      success: true,
      message: `Import selesai. ${imported} bisnis disimpan, ${duplicates} duplikat dilewati.`,
      imported,
      duplicates,
      errors
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Trigger On-Demand AI Enrichment
router.post('/companies/:id/enrich', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [comp] = await query('SELECT * FROM marketing_companies WHERE id = ?', [id]);
    if (!comp) return res.status(404).json({ success: false, message: 'Prospect tidak ditemukan.' });

    const enriched = await extractAndEnrichBusiness(comp, {
      source_name: comp.primary_source_name || 'Manual Admin Enrichment',
      source_url: comp.website_url || 'N/A'
    }, id);

    // Update company with enriched insights
    await query(
      `UPDATE marketing_companies 
       SET description = COALESCE(description, ?),
           potential_needs_json = ?,
           recommended_services_json = ?,
           enrichment_count = enrichment_count + 1,
           last_enriched_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        enriched.description,
        JSON.stringify(enriched.potential_needs || []),
        JSON.stringify(enriched.recommended_services || []),
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Enrichment Gemini AI selesai.',
      enriched
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Trigger On-Demand Website Audit
router.post('/companies/:id/audit-website', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [comp] = await query('SELECT * FROM marketing_companies WHERE id = ?', [id]);
    if (!comp || !comp.website_url) {
      return res.status(400).json({ success: false, message: 'Perusahaan tidak memiliki website URL.' });
    }

    const audit = await auditCompanyWebsite(id, comp.website_url);
    return res.json({
      success: true,
      message: 'Audit website berhasil diselesaikan.',
      audit
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 3. CONTACT INTELLIGENCE
// -----------------------------------------------------
router.get('/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const { search, role, outreach_eligible } = req.query;

    const whereClauses = ['1=1'];
    const params = [];

    if (search) {
      whereClauses.push('(c.full_name LIKE ? OR c.email LIKE ? OR comp.name LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (role && role !== 'all') {
      whereClauses.push('c.role_category = ?');
      params.push(role);
    }
    if (outreach_eligible !== undefined && outreach_eligible !== '') {
      whereClauses.push('c.outreach_eligible = ?');
      params.push(outreach_eligible === 'true' || outreach_eligible === '1' ? 1 : 0);
    }

    const whereSql = whereClauses.join(' AND ');

    const [totalRow] = await query(
      `SELECT COUNT(*) as total 
       FROM marketing_contacts c 
       LEFT JOIN marketing_companies comp ON c.company_id = comp.id 
       WHERE ${whereSql}`,
      params
    );

    const contacts = await query(
      `SELECT c.*, comp.name as company_name, comp.website_url as company_website, comp.city as company_city
       FROM marketing_contacts c 
       LEFT JOIN marketing_companies comp ON c.company_id = comp.id 
       WHERE ${whereSql} 
       ORDER BY c.id DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total: totalRow.total,
        totalPages: Math.ceil(totalRow.total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/contacts', async (req, res) => {
  try {
    const { company_id, full_name, position, role_category, email, phone, is_primary, outreach_eligible } = req.body;
    if (!company_id || !full_name) {
      return res.status(400).json({ success: false, message: 'company_id dan full_name wajib diisi.' });
    }

    const insert = await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, email, phone, is_primary, outreach_eligible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id, full_name, position || null, role_category || 'Other', email || null, phone || null, is_primary ? 1 : 0, outreach_eligible ? 1 : 0]
    );

    return res.json({ success: true, message: 'Kontak berhasil ditambahkan.', contact_id: insert.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/contacts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { full_name, position, role_category, email, phone, is_primary, outreach_eligible, verification_status } = req.body;

    await query(
      `UPDATE marketing_contacts 
       SET full_name = COALESCE(?, full_name),
           position = COALESCE(?, position),
           role_category = COALESCE(?, role_category),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           is_primary = COALESCE(?, is_primary),
           outreach_eligible = COALESCE(?, outreach_eligible),
           verification_status = COALESCE(?, verification_status),
           updated_at = NOW()
       WHERE id = ?`,
      [full_name, position, role_category, email, phone, is_primary, outreach_eligible, verification_status, id]
    );

    return res.json({ success: true, message: 'Kontak berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM marketing_contacts WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Kontak berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 4. SCRAPING SOURCES & JOBS
// -----------------------------------------------------
router.get('/sources', async (req, res) => {
  try {
    const sources = await query('SELECT * FROM marketing_sources ORDER BY id ASC');
    const jobs = await query('SELECT * FROM marketing_scraping_jobs ORDER BY id DESC LIMIT 15');
    return res.json({ success: true, sources, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const { name, url, source_type, data_category, collection_method, permission_notes, rate_limit_per_minute, max_records_per_run } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama sumber wajib diisi.' });

    const insert = await query(
      `INSERT INTO marketing_sources 
       (name, url, source_type, data_category, collection_method, permission_notes, rate_limit_per_minute, max_records_per_run, is_active, health_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'healthy')`,
      [name, url, source_type || 'custom_directory', data_category || 'UMKM & Business', collection_method || 'scraper', permission_notes, rate_limit_per_minute || 20, max_records_per_run || 50]
    );

    return res.json({ success: true, message: 'Sumber scraping berhasil ditambahkan.', source_id: insert.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/sources/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, url, is_active, rate_limit_per_minute, max_records_per_run, schedule_cron, permission_notes } = req.body;

    await query(
      `UPDATE marketing_sources 
       SET name = COALESCE(?, name),
           url = COALESCE(?, url),
           is_active = COALESCE(?, is_active),
           rate_limit_per_minute = COALESCE(?, rate_limit_per_minute),
           max_records_per_run = COALESCE(?, max_records_per_run),
           schedule_cron = COALESCE(?, schedule_cron),
           permission_notes = COALESCE(?, permission_notes),
           updated_at = NOW()
       WHERE id = ?`,
      [name, url, is_active, rate_limit_per_minute, max_records_per_run, schedule_cron, permission_notes, id]
    );

    return res.json({ success: true, message: 'Konfigurasi sumber berhasil disimpan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Trigger Immediate Manual Scraping
router.post('/sources/:id/run', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { sector, province, city, limit } = req.body || {};

    // Run discovery job asynchronously or return result
    const result = await runDiscoveryJob(id, { sector, province, city, limit });
    return res.json({
      success: true,
      message: `Scraping selesai. Ditemukan: ${result.recordsFound}, Disimpan: ${result.recordsSaved}, Duplikat: ${result.recordsDuplicate}`,
      result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 5. EMAIL CAMPAIGNS, CANDIDATES & TEMPLATES
// -----------------------------------------------------

// Get Email Candidates (Only businesses with valid email contact, with contacted status)
router.get('/campaigns/candidates', async (req, res) => {
  try {
    const { scope, status, search } = req.query;
    let where = ["((c.email IS NOT NULL AND c.email != '') OR EXISTS (SELECT 1 FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != ''))"];
    const params = [];

    if (scope === 'indonesia') {
      where.push('(c.is_international = 0 OR c.country = "Indonesia")');
    } else if (scope === 'international') {
      where.push('(c.is_international = 1 OR c.country != "Indonesia")');
    }

    if (status === 'uncontacted') {
      where.push('(c.contacted_times = 0 AND NOT EXISTS (SELECT 1 FROM marketing_email_logs l WHERE l.company_id = c.id AND l.status = "sent"))');
    } else if (status === 'contacted') {
      where.push('(c.contacted_times > 0 OR EXISTS (SELECT 1 FROM marketing_email_logs l WHERE l.company_id = c.id AND l.status = "sent"))');
    }

    if (search) {
      where.push('(c.name LIKE ? OR c.email LIKE ? OR c.city LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const candidates = await query(`
      SELECT c.id, c.name, c.email, c.business_scale, c.category, c.country, c.city, c.province, c.is_international,
             c.status as company_status,
             c.last_contacted_at,
             c.contacted_times,
             (SELECT COUNT(*) FROM marketing_email_logs l WHERE l.company_id = c.id AND l.status = 'sent') as email_sent_count,
             (SELECT MAX(sent_at) FROM marketing_email_logs l WHERE l.company_id = c.id AND l.status = 'sent') as last_sent_at,
             (SELECT mc.full_name FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_person_name,
             (SELECT mc.position FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_person_position,
             (SELECT mc.email FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_person_email,
             (SELECT mc.id FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_person_id
      FROM marketing_companies c
      WHERE ${where.join(' AND ')}
      ORDER BY c.is_priority DESC, c.contacted_times ASC, c.id DESC
      LIMIT 250
    `, params);

    return res.json({ success: true, data: candidates });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get Sent Email Logs (History)
router.get('/email-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const { search, status, company_id } = req.query;

    const where = ['1=1'];
    const params = [];

    if (company_id) {
      where.push('l.company_id = ?');
      params.push(company_id);
    }
    if (status && status !== 'all') {
      where.push('l.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(l.recipient_email LIKE ? OR l.recipient_name LIKE ? OR l.company_name LIKE ? OR l.subject LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [totalRow] = await query(
      `SELECT COUNT(*) as total 
       FROM marketing_email_logs l 
       LEFT JOIN marketing_companies c ON l.company_id = c.id 
       WHERE ${where.join(' AND ')}`,
      params
    );
    const total = totalRow ? totalRow.total : 0;

    const logs = await query(
      `SELECT l.*, 
              c.name as current_company_name, 
              c.country, 
              c.is_international,
              mc.position as contact_position,
              camp.name as campaign_name
       FROM marketing_email_logs l
       LEFT JOIN marketing_companies c ON l.company_id = c.id
       LEFT JOIN marketing_contacts mc ON l.contact_id = mc.id
       LEFT JOIN marketing_campaigns camp ON l.campaign_id = camp.id
       WHERE ${where.join(' AND ')}
       ORDER BY l.sent_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await query('SELECT * FROM marketing_campaigns ORDER BY id DESC');
    const templates = await query('SELECT * FROM marketing_email_templates ORDER BY is_default DESC, id ASC');
    const quota = await getDailyQuotaStatus();
    return res.json({ success: true, campaigns, templates, quota });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { 
      name, 
      template_id, 
      target_industry, 
      target_province, 
      target_category, 
      target_lead_score_min, 
      subject, 
      body_html,
      target_company_ids = [],
      avoid_recently_contacted = true
    } = req.body;

    if (!name || !subject || !body_html) {
      return res.status(400).json({ success: false, message: 'Name, subject, dan body_html wajib diisi.' });
    }

    let candidateCompanies = [];

    // If explicit company IDs were selected by user in the UI
    if (Array.isArray(target_company_ids) && target_company_ids.length > 0) {
      const placeholders = target_company_ids.map(() => '?').join(',');
      candidateCompanies = await query(
        `SELECT c.id, c.name, c.email,
                (SELECT mc.email FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_email,
                (SELECT mc.full_name FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_name,
                (SELECT mc.id FROM marketing_contacts mc WHERE mc.company_id = c.id AND mc.email IS NOT NULL AND mc.email != '' LIMIT 1) as contact_id
         FROM marketing_companies c 
         WHERE c.id IN (${placeholders})`,
        target_company_ids
      );
    } else {
      // Build recipient list based on targeting filters
      const whereTarget = ["outreach_eligibility = 'eligible'", "email IS NOT NULL AND email != ''"];
      const params = [];

      if (target_industry && target_industry !== 'all') {
        whereTarget.push('industry = ?');
        params.push(target_industry);
      }
      if (target_province && target_province !== 'all') {
        whereTarget.push('province = ?');
        params.push(target_province);
      }
      if (target_category && target_category !== 'all') {
        whereTarget.push('category = ?');
        params.push(target_category);
      }
      if (target_lead_score_min) {
        whereTarget.push('lead_score >= ?');
        params.push(parseInt(target_lead_score_min, 10));
      }

      candidateCompanies = await query(
        `SELECT id, name, email FROM marketing_companies WHERE ${whereTarget.join(' AND ')}`,
        params
      );
    }

    // Filter out suppression list & enforce deduplication
    const validRecipients = [];
    const seenEmails = new Set();
    let skippedDuplicates = 0;

    for (const comp of candidateCompanies) {
      const emailToUse = (comp.email || comp.contact_email || '').toLowerCase().trim();
      if (!emailToUse || seenEmails.has(emailToUse)) {
        skippedDuplicates++;
        continue;
      }

      // Check suppression list
      if (await isSuppressed(emailToUse)) {
        continue;
      }

      // Anti-Double Sending: check if contacted in last 7 days
      if (avoid_recently_contacted) {
        const recent = await query(
          'SELECT id FROM marketing_email_logs WHERE recipient_email = ? AND status = "sent" AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) LIMIT 1',
          [emailToUse]
        );
        if (recent.length > 0) {
          skippedDuplicates++;
          continue;
        }
      }

      seenEmails.add(emailToUse);
      validRecipients.push({
        company_id: comp.id,
        company_name: comp.name,
        contact_id: comp.contact_id || null,
        recipient_name: comp.contact_name || comp.name,
        recipient_email: emailToUse
      });
    }

    const campInsert = await query(
      `INSERT INTO marketing_campaigns 
       (name, template_id, target_industry, target_province, target_category, target_lead_score_min, subject, body_html, status, total_recipients)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [name, template_id || null, target_industry || 'Custom Selection', target_province || 'Custom', target_category || 'Custom', target_lead_score_min || 0, subject, body_html, validRecipients.length]
    );
    const campaignId = campInsert.insertId;

    // Insert recipients with idempotency keys
    for (const rec of validRecipients) {
      const idempotencyKey = `camp_${campaignId}_comp_${rec.company_id}_${Buffer.from(rec.recipient_email).toString('hex').slice(0, 16)}`;
      await query(
        `INSERT IGNORE INTO marketing_campaign_recipients 
         (campaign_id, company_id, contact_id, recipient_email, recipient_name, company_name, idempotency_key, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [campaignId, rec.company_id, rec.contact_id || null, rec.recipient_email, rec.recipient_name, rec.company_name, idempotencyKey]
      );
    }

    return res.json({
      success: true,
      message: `Campaign "${name}" berhasil dibuat dengan ${validRecipients.length} target bisnis unik.${skippedDuplicates > 0 ? ` (${skippedDuplicates} dihindari untuk mencegah pesan ganda).` : ''}`,
      campaign_id: campaignId,
      total_recipients: validRecipients.length,
      skipped_duplicates: skippedDuplicates
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Send Test Email to Internal Admin Recipient
router.post('/campaigns/:id/send-test', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [camp] = await query('SELECT * FROM marketing_campaigns WHERE id = ?', [id]);
    if (!camp) return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan.' });

    const testEmailAddress = req.body.test_email || process.env.MAIL_ADMIN_RECIPIENT || 'dzikrirabbani2401@gmail.com';

    await sendMarketingEmail({
      campaignId: id,
      companyId: null,
      recipientEmail: testEmailAddress,
      recipientName: 'Admin 1sLabs (Test Mode)',
      companyName: 'PT Contoh Usaha Mandiri',
      subject: `[TEST PREVIEW] ${camp.subject}`,
      bodyHtml: camp.body_html,
      variables: {
        business_name: 'PT Contoh Usaha Mandiri',
        contact_name: 'Admin 1sLabs',
        city: 'Bandung',
        province: 'Jawa Barat'
      }
    });

    return res.json({
      success: true,
      message: `Test email berhasil dikirim ke ${testEmailAddress}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get Campaign Recipients
router.get('/campaigns/:id/recipients', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const recipients = await query(
      `SELECT r.*, c.name as comp_name, c.city, c.province, c.is_international, c.country 
       FROM marketing_campaign_recipients r 
       LEFT JOIN marketing_companies c ON r.company_id = c.id 
       WHERE r.campaign_id = ? 
       ORDER BY r.id ASC`,
      [id]
    );
    return res.json({ success: true, data: recipients });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Start Campaign Execution (Batch dispatch respecting daily 100 quota with anti-double protection)
router.post('/campaigns/:id/start', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { recipient_ids = [] } = req.body || {};
    const [camp] = await query('SELECT * FROM marketing_campaigns WHERE id = ?', [id]);
    if (!camp) return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan.' });

    const quota = await getDailyQuotaStatus();
    if (quota.is_quota_exhausted) {
      return res.status(429).json({
        success: false,
        message: `Batas kuota harian maksimal (${quota.max_limit} email/hari) telah tercapai untuk hari ini. Campaign dijadwalkan ulang besok.`
      });
    }

    // Mark campaign running
    await query("UPDATE marketing_campaigns SET status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = ?", [id]);

    let pendingRecipients = [];
    if (Array.isArray(recipient_ids) && recipient_ids.length > 0) {
      const placeholders = recipient_ids.map(() => '?').join(',');
      pendingRecipients = await query(
        `SELECT r.*, c.name as comp_name, c.city, c.province 
         FROM marketing_campaign_recipients r 
         LEFT JOIN marketing_companies c ON r.company_id = c.id 
         WHERE r.campaign_id = ? AND r.id IN (${placeholders}) AND r.status = 'pending'`,
        [id, ...recipient_ids]
      );
    } else {
      const batchLimit = Math.min(quota.remaining_quota, 50);
      pendingRecipients = await query(
        `SELECT r.*, c.name as comp_name, c.city, c.province 
         FROM marketing_campaign_recipients r 
         LEFT JOIN marketing_companies c ON r.company_id = c.id 
         WHERE r.campaign_id = ? AND r.status = 'pending' 
         LIMIT ?`,
        [id, batchLimit]
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedDuplicates = 0;

    for (const rec of pendingRecipients) {
      try {
        await sendMarketingEmail({
          campaignId: id,
          companyId: rec.company_id,
          contactId: rec.contact_id || null,
          recipientEmail: rec.recipient_email,
          recipientName: rec.recipient_name,
          companyName: rec.comp_name || rec.company_name,
          subject: camp.subject,
          bodyHtml: camp.body_html,
          variables: {
            business_name: rec.comp_name || rec.company_name || 'Bapak/Ibu',
            contact_name: rec.recipient_name || 'Bapak/Ibu',
            city: rec.city || 'Indonesia',
            province: rec.province || ''
          }
        });
        sentCount++;
      } catch (sendErr) {
        if (sendErr.message.includes('sudah pernah dikirimkan')) {
          skippedDuplicates++;
          await query('UPDATE marketing_campaign_recipients SET status = "skipped", error_message = ? WHERE id = ?', [sendErr.message, rec.id]).catch(() => {});
        } else {
          failedCount++;
          if (sendErr.message.includes('kuota harian')) {
            break;
          }
        }
      }
    }

    // Check if any recipients remain
    const [remainCount] = await query('SELECT COUNT(*) as count FROM marketing_campaign_recipients WHERE campaign_id = ? AND status = "pending"', [id]);
    if (remainCount.count === 0) {
      await query("UPDATE marketing_campaigns SET status = 'completed', completed_at = NOW() WHERE id = ?", [id]);
    }

    return res.json({
      success: true,
      message: `Batch pengiriman selesai: ${sentCount} berhasil dikirim${skippedDuplicates > 0 ? `, ${skippedDuplicates} dihindari (anti-double)` : ''}${failedCount > 0 ? `, ${failedCount} gagal` : ''}.`,
      sentCount,
      failedCount,
      skippedDuplicates,
      remainingInCampaign: remainCount.count
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Templates CRUD
router.get('/templates', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM marketing_email_templates ORDER BY is_default DESC, id ASC');
    return res.json({ success: true, templates });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { name, category, subject, body_html, variables_json } = req.body;
    const insert = await query(
      `INSERT INTO marketing_email_templates (name, category, subject, body_html, variables_json)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category || 'General Outreach', subject, body_html, JSON.stringify(variables_json || ['business_name', 'unsubscribe_url'])]
    );
    return res.json({ success: true, message: 'Template berhasil dibuat.', template_id: insert.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, subject, body_html } = req.body;
    await query(
      `UPDATE marketing_email_templates 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           subject = COALESCE(?, subject),
           body_html = COALESCE(?, body_html),
           updated_at = NOW()
       WHERE id = ?`,
      [name, category, subject, body_html, id]
    );
    return res.json({ success: true, message: 'Template berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 6. INBOX & EMAIL REPLIES
// -----------------------------------------------------
router.get('/inbox', async (req, res) => {
  try {
    const replies = await query(`
      SELECT r.*, c.name as company_name, c.email as company_email, c.phone as company_phone
      FROM marketing_email_replies r
      LEFT JOIN marketing_companies c ON r.company_id = c.id
      ORDER BY r.id DESC
    `);
    return res.json({ success: true, replies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/inbox/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { classification, status, admin_notes } = req.body;

    await query(
      `UPDATE marketing_email_replies 
       SET classification = COALESCE(?, classification),
           status = COALESCE(?, status),
           admin_notes = COALESCE(?, admin_notes)
       WHERE id = ?`,
      [classification, status, admin_notes, id]
    );

    // If marked Unsubscribe, automatically add to suppression list
    if (classification === 'Unsubscribe') {
      const [reply] = await query('SELECT from_email FROM marketing_email_replies WHERE id = ?', [id]);
      if (reply && reply.from_email) {
        await addToSuppressionList(reply.from_email, 'unsubscribe', 'Marked unsubscribe by admin via inbox', 'admin_inbox');
      }
    }

    return res.json({ success: true, message: 'Status balasan berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 7. FOLLOW-UPS & REMINDERS
// -----------------------------------------------------
router.get('/followups', async (req, res) => {
  try {
    const followups = await query(`
      SELECT f.*, c.name as company_name, c.phone as company_phone, c.email as company_email, c.city as company_city
      FROM marketing_followups f
      LEFT JOIN marketing_companies c ON f.company_id = c.id
      ORDER BY f.due_date ASC
    `);
    return res.json({ success: true, followups });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/followups', async (req, res) => {
  try {
    const { company_id, title, notes, due_date, priority } = req.body;
    if (!company_id || !title || !due_date) {
      return res.status(400).json({ success: false, message: 'company_id, title, dan due_date wajib diisi.' });
    }

    const insert = await query(
      `INSERT INTO marketing_followups (company_id, title, notes, due_date, priority, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [company_id, title, notes, due_date, priority || 'medium']
    );

    return res.json({ success: true, message: 'Follow-up berhasil dijadwalkan.', followup_id: insert.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/followups/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes, due_date } = req.body;

    await query(
      `UPDATE marketing_followups 
       SET status = COALESCE(?, status),
           notes = COALESCE(?, notes),
           due_date = COALESCE(?, due_date),
           completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = ?`,
      [status, notes, due_date, status, id]
    );

    return res.json({ success: true, message: 'Follow-up diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 8. SUPPRESSIONS & PRIVACY
// -----------------------------------------------------
router.get('/suppressions', async (req, res) => {
  try {
    const list = await query('SELECT * FROM marketing_suppressions ORDER BY id DESC');
    return res.json({ success: true, suppressions: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/suppressions', async (req, res) => {
  try {
    const { email, reason, notes } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });

    await addToSuppressionList(email, reason || 'manual', notes, 'admin_manual');
    return res.json({ success: true, message: `Email ${email} berhasil ditambahkan ke suppression list.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/suppressions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM marketing_suppressions WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Suppression record dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 9. MARKETING SETTINGS
// -----------------------------------------------------
router.get('/settings', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM marketing_settings');
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.setting_key] = s.setting_value;
    }
    return res.json({ success: true, settings: settingsMap, raw: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO marketing_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(value)]
      );
    }
    return res.json({ success: true, message: 'Pengaturan marketing berhasil disimpan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// 10. AI RESEARCH AGENT LOGS & PROMPT TESTER
// -----------------------------------------------------
router.get('/ai-logs', async (req, res) => {
  try {
    const logs = await query('SELECT * FROM marketing_ai_logs ORDER BY id DESC LIMIT 50');
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai-test', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt tidak boleh kosong.' });

    const result = await callGeminiApi({
      prompt,
      model: model || 'gemini-3.8-flash',
      purpose: 'admin_test'
    });

    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
