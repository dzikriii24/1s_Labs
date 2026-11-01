const { query } = require('../../db');
const { recoverSmallBusinessContact } = require('./gemini.service');

/**
 * Perform deep contact recovery on a single company
 */
async function recoverCompanyContact(companyId) {
  const rows = await query('SELECT * FROM marketing_companies WHERE id = ?', [companyId]);
  const company = rows[0];
  if (!company) throw new Error(`Perusahaan #${companyId} tidak ditemukan.`);

  const recovery = await recoverSmallBusinessContact(company);

  // Normalize confidence score to 0.00 - 0.99 for DECIMAL(3,2)
  const rawConfidence = Number(recovery.confidence_score) || 0.85;
  const confScore = rawConfidence > 1 
    ? Math.min(0.99, Number((rawConfidence / 100).toFixed(2))) 
    : Math.min(0.99, Math.max(0.1, Number(rawConfidence.toFixed(2))));

  // 1. Identify newly discovered points
  const updates = [];
  const params = [];

  let newContactPoints = 0;

  // Website
  if (recovery.official_website && !company.website_url) {
    updates.push('website_url = ?', 'has_website = 1', "website_status = 'active'");
    params.push(recovery.official_website);
    newContactPoints++;

    // Add to marketing_contacts
    await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, channel, profile_url, contact_type, contact_value, confidence_score, source_name, verification_status, notes)
       VALUES (?, ?, 'Website Resmi', 'Other', 'Website', ?, 'website', ?, ?, ?, ?, ?)`,
      [
        companyId,
        company.name,
        recovery.official_website,
        recovery.official_website,
        confScore,
        recovery.evidence_source || 'Gemini Contact Recovery',
        recovery.recovery_status || 'Verified',
        'Website resmi bisnis ditemukan via contact recovery'
      ]
    );
  }

  // WhatsApp
  if (recovery.public_whatsapp && !company.whatsapp_number) {
    updates.push('whatsapp_number = ?');
    params.push(recovery.public_whatsapp);
    newContactPoints++;

    await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, phone, channel, contact_type, contact_value, confidence_score, source_name, verification_status, outreach_eligible, notes)
       VALUES (?, ?, 'WhatsApp Bisnis', 'Owner', ?, 'WhatsApp', 'whatsapp', ?, ?, ?, ?, 1, ?)`,
      [
        companyId,
        company.name,
        recovery.public_whatsapp,
        recovery.public_whatsapp,
        confScore,
        recovery.evidence_source || 'Gemini Contact Recovery',
        recovery.recovery_status || 'Verified',
        'Kanal WhatsApp bisnis resmi untuk order/konsultasi pelanggan'
      ]
    );
  }

  // Public Phone
  if (recovery.public_phone && !company.phone) {
    updates.push('phone = ?');
    params.push(recovery.public_phone);
    newContactPoints++;
  }

  // Public Email
  if (recovery.public_email && !company.email) {
    updates.push('email = ?', 'outreach_eligibility = 1');
    params.push(recovery.public_email);
    newContactPoints++;

    await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, email, channel, contact_type, contact_value, confidence_score, source_name, verification_status, outreach_eligible, notes)
       VALUES (?, ?, 'Email Korespondensi', 'Owner', ?, 'Email', 'email', ?, ?, ?, ?, 1, ?)`,
      [
        companyId,
        company.name,
        recovery.public_email,
        recovery.public_email,
        confScore,
        recovery.evidence_source || 'Gemini Contact Recovery',
        'Likely Correct',
        'Email bisnis publik untuk komunikasi penawaran 1sLabs'
      ]
    );
  }

  // Instagram
  if (recovery.instagram_url && !company.instagram_url) {
    updates.push('instagram_url = ?');
    params.push(recovery.instagram_url);
    newContactPoints++;

    await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, channel, profile_url, contact_type, contact_value, confidence_score, source_name, verification_status, notes)
       VALUES (?, ?, 'Instagram Bisnis', 'Owner', 'Instagram', ?, 'instagram', ?, ?, ?, ?, ?)`,
      [
        companyId,
        company.name,
        recovery.instagram_url,
        recovery.instagram_url,
        confScore,
        recovery.evidence_source || 'Gemini Contact Recovery',
        'Verified',
        'Profil resmi Instagram UMKM / Local Business'
      ]
    );
  }

  // Store Address
  if (recovery.public_address && (!company.full_address || company.full_address.length < 5)) {
    updates.push('full_address = ?');
    params.push(recovery.public_address);
  }

  // Management / People Contacts
  if (Array.isArray(recovery.management_contacts) && recovery.management_contacts.length > 0) {
    for (const m of recovery.management_contacts) {
      if (m.name && m.name.length > 2) {
        newContactPoints++;
        await query(
          `INSERT INTO marketing_contacts 
           (company_id, full_name, position, role_category, email, phone, contact_type, contact_value, confidence_score, source_name, verification_status, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'person', ?, ?, ?, 'Verified', ?)`,
          [
            companyId,
            m.name,
            m.role || 'Owner / Pengelola',
            m.role || 'Owner',
            m.email || null,
            m.phone || null,
            m.name,
            confScore,
            recovery.evidence_source || 'Gemini Contact Recovery',
            m.notes || 'Kontak pengelola/owner yang dipublikasikan'
          ]
        );
      }
    }
  }

  // Lead scoring updates
  if (recovery.lead_scoring) {
    const calcScore = recovery.lead_scoring.calculated_score || company.lead_score || 50;
    let grade = 'cold';
    if (calcScore >= 70) grade = 'hot';
    else if (calcScore >= 45) grade = 'warm';

    updates.push('lead_score = ?', 'lead_grade = ?', 'lead_score_breakdown = ?');
    params.push(
      calcScore,
      grade,
      JSON.stringify(recovery.lead_scoring.scoring_reasons || [])
    );
  }

  if (Array.isArray(recovery.recommended_services) && recovery.recommended_services.length > 0) {
    updates.push('recommended_services_json = ?');
    params.push(JSON.stringify(recovery.recommended_services));
  }

  updates.push("status = 'Verified'", 'enrichment_count = enrichment_count + 1', 'last_enriched_at = NOW()');

  // Execute update on marketing_companies
  if (updates.length > 0) {
    params.push(companyId);
    await query(`UPDATE marketing_companies SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  // Fetch updated record
  const updatedRows = await query('SELECT * FROM marketing_companies WHERE id = ?', [companyId]);
  const contacts = await query('SELECT * FROM marketing_contacts WHERE company_id = ?', [companyId]);

  return {
    success: true,
    company: updatedRows[0],
    contacts,
    newContactPoints,
    recovery
  };
}

/**
 * Execute batch re-enrichment across existing businesses
 */
async function runBatchContactRecovery({ companyIds = [], filter = 'all', limit = 20 }) {
  let targetIds = companyIds;

  if (!targetIds || targetIds.length === 0) {
    let whereClause = 'is_deleted = 0';
    if (filter === 'no_contacts') {
      whereClause += ' AND id NOT IN (SELECT DISTINCT company_id FROM marketing_contacts)';
    } else if (filter === 'no_email') {
      whereClause += ' AND (email IS NULL OR email = "")';
    } else if (filter === 'no_phone') {
      whereClause += ' AND (phone IS NULL OR phone = "") AND (whatsapp_number IS NULL OR whatsapp_number = "")';
    } else if (filter === 'no_website') {
      whereClause += ' AND (website_url IS NULL OR website_url = "")';
    } else if (filter === 'partially_enriched') {
      whereClause += ' AND (email IS NULL OR phone IS NULL OR website_url IS NULL)';
    }

    const rows = await query(`SELECT id FROM marketing_companies WHERE ${whereClause} ORDER BY id ASC LIMIT ?`, [limit]);
    targetIds = rows.map(r => r.id);
  }

  const results = {
    total_selected: targetIds.length,
    processing: targetIds.length,
    successfully_enriched: 0,
    partially_enriched: 0,
    no_additional_data_found: 0,
    failed: 0,
    needs_manual_review: 0,
    items: []
  };

  for (const id of targetIds) {
    try {
      const res = await recoverCompanyContact(id);
      if (res.newContactPoints >= 2) {
        results.successfully_enriched++;
      } else if (res.newContactPoints === 1) {
        results.partially_enriched++;
      } else {
        results.no_additional_data_found++;
      }

      if (res.recovery?.recovery_status === 'Needs Manual Review') {
        results.needs_manual_review++;
      }

      results.items.push({
        id,
        name: res.company.name,
        newContactPoints: res.newContactPoints,
        lead_score: res.company.lead_score,
        status: res.recovery?.recovery_status || 'Completed'
      });
    } catch (err) {
      results.failed++;
      results.items.push({
        id,
        error: err.message,
        status: 'Failed'
      });
    }
  }

  results.processing = 0;
  return results;
}

/**
 * Get Contact Recovery Summary Stats for dashboard widgets
 */
async function getContactRecoveryStats() {
  const total = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE is_deleted = 0');
  const noContactInfo = await query(`
    SELECT COUNT(*) as total FROM marketing_companies 
    WHERE is_deleted = 0 
      AND (email IS NULL OR email = "") 
      AND (phone IS NULL OR phone = "") 
      AND (whatsapp_number IS NULL OR whatsapp_number = "") 
      AND (website_url IS NULL OR website_url = "")
  `);
  const noEmail = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE is_deleted = 0 AND (email IS NULL OR email = "")');
  const noPhone = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE is_deleted = 0 AND (phone IS NULL OR phone = "") AND (whatsapp_number IS NULL OR whatsapp_number = "")');
  const noWebsite = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE is_deleted = 0 AND (website_url IS NULL OR website_url = "")');
  const noSocial = await query('SELECT COUNT(*) as total FROM marketing_companies WHERE is_deleted = 0 AND (instagram_url IS NULL OR instagram_url = "")');

  const contactsTotal = await query('SELECT COUNT(*) as total FROM marketing_contacts');
  const verifiedContacts = await query("SELECT COUNT(*) as total FROM marketing_contacts WHERE verification_status = 'Verified'");
  const outreachEligible = await query('SELECT COUNT(*) as total FROM marketing_contacts WHERE outreach_eligible = 1');

  return {
    total_companies: total[0].total,
    no_contact_info: noContactInfo[0].total,
    no_email: noEmail[0].total,
    no_phone: noPhone[0].total,
    no_website: noWebsite[0].total,
    no_social: noSocial[0].total,
    total_contacts: contactsTotal[0].total,
    verified_contacts: verifiedContacts[0].total,
    outreach_eligible_contacts: outreachEligible[0].total
  };
}

module.exports = {
  recoverCompanyContact,
  runBatchContactRecovery,
  getContactRecoveryStats
};

