const { query, withTransaction } = require('../../db');
const { getScraperAdapter } = require('./scrapers');
const { extractAndEnrichBusiness } = require('./gemini.service');
const { findPotentialDuplicate, mergeCompanyData, normalizeBusinessName, normalizeDomain, normalizePhone } = require('./deduplication.service');
const { auditCompanyWebsite } = require('./websiteAudit.service');

/**
 * Execute a scraping job for a specific source
 */
async function runDiscoveryJob(sourceId, options = {}) {
  const sourceRows = await query('SELECT * FROM marketing_sources WHERE id = ?', [sourceId]);
  const source = sourceRows[0];
  if (!source) {
    throw new Error(`Marketing source #${sourceId} not found`);
  }

  // 1. Create Job Entry
  const targetSector = options.sector || 'Semua Sektor (Multi-Industri)';
  const targetProvince = options.province || 'Semua Wilayah Indonesia';
  const targetCity = options.city || null;
  const limit = options.limit || source.max_records_per_run || 30;

  const jobInsert = await query(
    `INSERT INTO marketing_scraping_jobs 
     (source_id, target_sector, target_province, target_city, status, started_at)
     VALUES (?, ?, ?, ?, 'running', NOW())`,
    [sourceId, targetSector, targetProvince, targetCity]
  );
  const jobId = jobInsert.insertId;

  const log = async (level, message, context = null) => {
    try {
      await query(
        'INSERT INTO marketing_scraping_logs (job_id, level, message, context_json) VALUES (?, ?, ?, ?)',
        [jobId, level, message, context ? JSON.stringify(context) : null]
      );
    } catch {}
  };

  await log('info', `Memulai discovery job #${jobId} untuk sumber: ${source.name}`, { sector: targetSector, province: targetProvince, limit });

  let recordsFound = 0;
  let recordsSaved = 0;
  let recordsDuplicate = 0;
  let recordsEnriched = 0;

  try {
    // 2. Instantiate Source Adapter & Fetch Records
    const adapter = getScraperAdapter(source);
    const rawItems = await adapter.fetchRecords({
      sector: targetSector,
      province: targetProvince,
      city: targetCity,
      limit,
      targetUrl: options.targetUrl || source.url
    });

    recordsFound = rawItems.length;
    await log('info', `Ditemukan ${recordsFound} data mentah dari sumber ${source.name}`);

    // 3. Process Each Raw Record through Staging & Deduplication
    for (const item of rawItems) {
      if (!item.name || item.name.trim().length < 2) continue;

      // Staging Area Entry
      const contentHash = Buffer.from(`${item.name}|${item.website_url || ''}|${item.phone || ''}`).toString('base64').slice(0, 64);
      let stagingId = null;
      try {
        const stageInsert = await query(
          `INSERT INTO marketing_raw_records (source_id, job_id, source_record_id, content_hash, raw_payload, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [sourceId, jobId, item.source_record_id || null, contentHash, JSON.stringify(item)]
        );
        stagingId = stageInsert.insertId;
      } catch (stageErr) {
        // Hash collision or duplicate in staging
      }

      // Check Deduplication
      const dupCheck = await findPotentialDuplicate({
        name: item.name,
        website_url: item.website_url,
        phone: item.phone,
        email: item.email,
        city: item.city,
        province: item.province
      });

      if (dupCheck.isDuplicate && dupCheck.confidence === 'HIGH') {
        recordsDuplicate++;
        await mergeCompanyData(
          dupCheck.existingCompany.id,
          item,
          sourceId,
          source.url,
          item.raw_payload
        );
        if (stagingId) {
          await query("UPDATE marketing_raw_records SET status = 'duplicate' WHERE id = ?", [stagingId]);
        }
        await log('info', `Data duplikat terdeteksi (HIGH confidence): "${item.name}" digabungkan ke ID #${dupCheck.existingCompany.id}`);
        continue;
      }

      // 4. Gemini AI Enrichment (if configured or enabled)
      let enrichedData = null;
      try {
        enrichedData = await extractAndEnrichBusiness(item, {
          source_name: source.name,
          source_url: source.url
        });
        if (enrichedData) {
          recordsEnriched++;
        }
      } catch (aiErr) {
        await log('warn', `Gemini enrichment dilewati untuk "${item.name}": ${aiErr.message}`);
      }

      // Consolidate Data
      const finalName = enrichedData?.business_name || item.name;
      const finalCategory = enrichedData?.category || item.category || 'UMKM';
      const finalIndustry = enrichedData?.industry || item.industry || targetSector;
      const finalDesc = enrichedData?.description || item.description || null;
      const finalProvince = enrichedData?.location?.province || item.province || targetProvince;
      const finalCity = enrichedData?.location?.city || item.city || targetCity;
      const finalAddress = enrichedData?.location?.full_address || item.address || null;
      const finalWebsite = enrichedData?.website_url || item.website_url || null;
      const finalPhone = enrichedData?.public_business_phone || item.phone || null;
      const finalEmail = enrichedData?.public_business_email || item.email || null;
      const potentialNeeds = enrichedData?.potential_needs || [];
      const recommendedServices = enrichedData?.recommended_services || ['Website Development'];

      const normName = normalizeBusinessName(finalName);
      const normDomain = normalizeDomain(finalWebsite);
      const normPhone = normalizePhone(finalPhone);

      // Determine initial outreach eligibility
      const isEligible = !!finalEmail;
      const eligibleReason = isEligible 
        ? 'Public business email found on official registry' 
        : 'Belum memiliki public business email valid';

      // Insert Company Record
      const compInsert = await query(
        `INSERT INTO marketing_companies 
         (name, normalized_name, category, business_type, industry, description, province, city, full_address, website_url, normalized_domain, phone, normalized_phone, email, email_status, country, is_international, currency, language, timezone, business_scale, whatsapp_number, instagram_url, status, outreach_eligibility, outreach_ineligible_reason, potential_needs_json, recommended_services_json, primary_source_name, first_discovered_at, last_discovered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Discovery', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          finalName,
          normName,
          finalCategory,
          item.business_type || null,
          finalIndustry,
          finalDesc,
          finalProvince,
          finalCity,
          finalAddress,
          finalWebsite,
          normDomain,
          finalPhone,
          normPhone,
          finalEmail,
          finalEmail ? 'UNVERIFIED' : 'NO_EMAIL',
          item.country || 'Indonesia',
          item.is_international ? 1 : 0,
          item.currency || 'IDR',
          item.language || 'id',
          item.timezone || 'Asia/Jakarta',
          item.business_scale || 'Small Business',
          item.whatsapp_number || null,
          item.instagram_url || null,
          isEligible ? 'eligible' : 'ineligible',
          eligibleReason,
          JSON.stringify(potentialNeeds),
          JSON.stringify(recommendedServices),
          source.name
        ]
      );
      const companyId = compInsert.insertId;
      recordsSaved++;

      // Link Source
      await query(
        `INSERT INTO marketing_company_sources (company_id, source_id, external_identifier, source_url, raw_snapshot)
         VALUES (?, ?, ?, ?, ?)`,
        [companyId, sourceId, item.source_record_id || null, source.url, JSON.stringify(item.raw_payload || {})]
      );

      // Save Professional Contacts if found
      const contactList = enrichedData?.contacts?.length ? enrichedData.contacts : (item.contacts || []);
      const VALID_ROLE_CATEGORIES = new Set([
        'Owner', 'Founder', 'Business Owner', 'Store Manager', 'Branch Manager',
        'CEO', 'Director', 'HR Manager', 'Human Resources',
        'Business Development', 'Marketing Manager', 'IT Manager', 'General Manager',
        'Operations Manager', 'General Contact Person', 'Other'
      ]);

      for (const c of contactList) {
        if (!c.full_name) continue;
        const safeRole = VALID_ROLE_CATEGORIES.has(c.role_category) ? c.role_category : 'Owner';
        await query(
          `INSERT INTO marketing_contacts 
           (company_id, full_name, position, role_category, email, phone, contact_type, contact_value, confidence_score, source_name, is_primary, outreach_eligible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyId,
            c.full_name,
            c.position || 'Pengelola / Owner',
            safeRole,
            c.email || null,
            c.phone || null,
            c.contact_type || 'person',
            c.contact_value || c.email || c.phone || c.full_name,
            c.confidence_score || 0.85,
            source.name,
            c.email && c.email === finalEmail ? 1 : 0,
            c.email ? 1 : 0
          ]
        );
      }

      // If website found, conduct non-intrusive Website Audit
      if (finalWebsite) {
        auditCompanyWebsite(companyId, finalWebsite).catch(err => {
          log('warn', `Audit website untuk ${finalWebsite} gagal: ${err.message}`);
        });
      }

      if (stagingId) {
        await query("UPDATE marketing_raw_records SET status = 'processed', processed_at = NOW() WHERE id = ?", [stagingId]);
      }
    }

    // 5. Complete Job & Update Source Health
    await query(
      `UPDATE marketing_scraping_jobs 
       SET status = 'completed', 
           records_found = ?, 
           records_saved = ?, 
           records_duplicate = ?, 
           records_enriched = ?, 
           completed_at = NOW() 
       WHERE id = ?`,
      [recordsFound, recordsSaved, recordsDuplicate, recordsEnriched, jobId]
    );

    await query(
      `UPDATE marketing_sources 
       SET health_status = 'healthy', 
           total_records_collected = total_records_collected + ?, 
           last_successful_run = NOW(), 
           last_error_message = NULL 
       WHERE id = ?`,
      [recordsSaved, sourceId]
    );

    await log('info', `Job #${jobId} selesai. Disimpan: ${recordsSaved}, Duplikat: ${recordsDuplicate}, Diperkaya AI: ${recordsEnriched}`);

    return {
      jobId,
      status: 'completed',
      recordsFound,
      recordsSaved,
      recordsDuplicate,
      recordsEnriched
    };
  } catch (err) {
    await query(
      `UPDATE marketing_scraping_jobs 
       SET status = 'failed', error_summary = ?, completed_at = NOW() 
       WHERE id = ?`,
      [err.message, jobId]
    );

    await query(
      `UPDATE marketing_sources 
       SET health_status = 'failing', last_failed_run = NOW(), last_error_message = ? 
       WHERE id = ?`,
      [err.message, sourceId]
    );

    await log('error', `Job #${jobId} gagal: ${err.message}`);
    throw err;
  }
}

/**
 * Daily Automated Discovery Runner
 * Triggered by cron or interval at 06:00 WIB
 */
async function runDailyAutomatedDiscovery() {
  console.log('[Marketing Discovery] Menjalankan automated discovery harian...');
  const activeSources = await query('SELECT id, name FROM marketing_sources WHERE is_active = 1');
  
  for (const src of activeSources) {
    try {
      console.log(`[Marketing Discovery] Running job for source: ${src.name}`);
      await runDiscoveryJob(src.id, { limit: 25 });
    } catch (err) {
      console.warn(`[Marketing Discovery Error for ${src.name}]:`, err.message);
    }
  }
}

module.exports = {
  runDiscoveryJob,
  runDailyAutomatedDiscovery
};
