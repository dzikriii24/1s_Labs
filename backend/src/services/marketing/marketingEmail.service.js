const crypto = require('crypto');
const path = require('path');
const { query, withTransaction } = require('../../db');
const { getTransporter, wrapHtmlEmail } = require('../email.service');
const { formatTextToEmailHtml } = require('../../utils/emailFormatter');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const APP_URL = process.env.BASE_URL || 'https://1slabs.my.id';
const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'info@1slabs.my.id';
const FROM_NAME = process.env.MAIL_FROM_NAME || '1s Labs';
const JWT_SECRET = process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026';

/**
 * Get current date in Asia/Jakarta timezone (YYYY-MM-DD)
 */
function getJakartaDateString() {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return jakartaTime.toISOString().slice(0, 10);
}

/**
 * Get current daily quota status
 */
async function getDailyQuotaStatus() {
  const today = getJakartaDateString();
  const [row] = await query(
    'SELECT * FROM marketing_daily_quotas WHERE quota_date = ? LIMIT 1',
    [today]
  );

  const limit = row ? row.max_limit : 100;
  const sent = row ? row.sent_count : 0;
  const remaining = Math.max(0, limit - sent);

  return {
    date: today,
    sent_count: sent,
    max_limit: limit,
    remaining_quota: remaining,
    is_quota_exhausted: remaining <= 0
  };
}

/**
 * Generate secure unsubscribe token
 */
function generateUnsubscribeToken(email) {
  return crypto.createHmac('sha256', JWT_SECRET).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Verify unsubscribe token
 */
function verifyUnsubscribeToken(email, token) {
  const expected = generateUnsubscribeToken(email);
  return expected === token;
}

/**
 * Check if an email or domain is on the suppression list
 */
async function isSuppressed(email) {
  if (!email) return true;
  const lowerEmail = email.toLowerCase().trim();
  const domain = lowerEmail.split('@')[1];

  const [row] = await query(
    `SELECT id, reason FROM marketing_suppressions 
     WHERE email = ? OR domain = ? LIMIT 1`,
    [lowerEmail, domain]
  );

  return !!row;
}

/**
 * Add an email to global suppression list
 */
async function addToSuppressionList(email, reason = 'unsubscribe', notes = null, source = 'user_optout') {
  if (!email) return;
  const lowerEmail = email.toLowerCase().trim();
  const domain = lowerEmail.split('@')[1];

  await query(
    `INSERT INTO marketing_suppressions (email, domain, reason, notes, source)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE reason = VALUES(reason), suppressed_at = NOW()`,
    [lowerEmail, domain, reason, notes, source]
  );

  // Mark all pending campaign recipients with this email as unsubscribed
  await query(
    `UPDATE marketing_campaign_recipients 
     SET status = 'unsubscribed' 
     WHERE recipient_email = ? AND status IN ('pending', 'queued')`,
    [lowerEmail]
  );

  // Update company status if matching email
  await query(
    `UPDATE marketing_companies 
     SET status = 'Do Not Contact', outreach_eligibility = 'ineligible', outreach_ineligible_reason = ? 
     WHERE email = ?`,
    [`Suppressed: ${reason}`, lowerEmail]
  );
}

/**
 * Substitute dynamic variables in template
 */
function substituteTemplateVariables(templateHtml, variables = {}) {
  let result = templateHtml;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value !== null && value !== undefined ? String(value) : '');
  }
  return result;
}

/**
 * Send a single marketing outreach email with strict quota, suppression enforcement, and anti-double validation
 */
async function sendMarketingEmail({ campaignId, companyId, contactId, recipientEmail, recipientName, companyName, subject, bodyHtml, variables = {}, allowDuplicate = false }) {
  const cleanEmail = recipientEmail.toLowerCase().trim();

  // 1. Check Suppression List
  if (await isSuppressed(cleanEmail)) {
    throw new Error(`Email ${cleanEmail} berada di suppression list (penerima telah opt-out atau unsubscribe).`);
  }

  // 2. Anti-Double Sending Validation (Strict Duplicate Prevention)
  if (!allowDuplicate) {
    const recentSends = await query(
      `SELECT id, sent_at, subject FROM marketing_email_logs 
       WHERE recipient_email = ? AND status = 'sent' 
       ${campaignId ? 'AND campaign_id = ?' : 'AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'} 
       LIMIT 1`,
      campaignId ? [cleanEmail, campaignId] : [cleanEmail]
    );
    if (recentSends.length > 0) {
      throw new Error(`Email ke ${cleanEmail} sudah pernah dikirimkan sebelumnya (${recentSends[0].sent_at}). Dibatalkan untuk mencegah pesan ganda.`);
    }
  }

  // 3. Atomic Quota Reservation in Transaction
  const today = getJakartaDateString();
  const reserved = await withTransaction(async (conn) => {
    // Lock daily quota row
    await conn.query(
      `INSERT INTO marketing_daily_quotas (quota_date, sent_count, max_limit) 
       VALUES (?, 0, 100) 
       ON DUPLICATE KEY UPDATE quota_date = quota_date`,
      [today]
    );

    const [rows] = await conn.query(
      'SELECT sent_count, max_limit FROM marketing_daily_quotas WHERE quota_date = ? FOR UPDATE',
      [today]
    );

    const current = rows[0];
    if (current.sent_count >= current.max_limit) {
      throw new Error(`Batas kuota harian maksimal (${current.max_limit} email/hari) telah tercapai untuk tanggal ${today}. Pengiriman dihentikan.`);
    }

    // Increment sent_count
    await conn.query(
      'UPDATE marketing_daily_quotas SET sent_count = sent_count + 1 WHERE quota_date = ?',
      [today]
    );

    return true;
  });

  // 4. Prepare Unsubscribe URL
  const token = generateUnsubscribeToken(cleanEmail);
  const unsubscribeUrl = `${APP_URL}/api/marketing/unsubscribe?email=${encodeURIComponent(cleanEmail)}&token=${token}`;

  // Merge variables
  const mergedVars = {
    business_name: companyName || 'Bapak/Ibu',
    company_name: companyName || 'Bapak/Ibu',
    contact_name: recipientName || 'Tim ' + (companyName || 'Bisnis'),
    unsubscribe_url: unsubscribeUrl,
    ...variables
  };

  const finalSubject = substituteTemplateVariables(subject, mergedVars);
  const bodyWithVars = substituteTemplateVariables(bodyHtml, mergedVars);
  const formattedBodyHtml = formatTextToEmailHtml(bodyWithVars);
  const rawBody = substituteTemplateVariables(formattedBodyHtml, mergedVars);

  // Detect language from subject & body content
  const contentForDetection = `${subject} ${bodyHtml}`.toLowerCase();
  const isEnglish = (variables && variables.language === 'en') ||
    contentForDetection.includes('warm regards') ||
    contentForDetection.includes('digital presence') ||
    contentForDetection.includes('hope this message') ||
    contentForDetection.includes('hi ') ||
    contentForDetection.includes('boutique digital') ||
    contentForDetection.includes('independent businesses');
  const isMalay = (variables && variables.language === 'ms') ||
    contentForDetection.includes('salam sejahtera') ||
    contentForDetection.includes('rakan kongsi') ||
    contentForDetection.includes('laman web');

  let ctaText = 'Jadwalkan Diskusi / Online Meeting';
  let ctaPreheader = `Peluang pengembangan solusi digital bersama 1sLabs untuk ${companyName || 'bisnis Anda'}.`;
  let ctaBadge = '1sLabs Partnership Opportunity';

  if (isEnglish) {
    ctaText = 'Schedule a Discussion / Online Meeting';
    ctaPreheader = `Digital presence & modern web solutions opportunity with 1sLabs for ${companyName || 'your business'}.`;
    ctaBadge = '1sLabs Official Partnership';
  } else if (isMalay) {
    ctaText = 'Jadualkan Perbincangan / Sesi Dalam Talian';
    ctaPreheader = `Peluang kerjasama pembangunan digital bersama 1sLabs untuk ${companyName || 'perniagaan anda'}.`;
    ctaBadge = 'Peluang Kerjasama Rasmi 1sLabs';
  }

  // Target URL for scheduling: includes query params for instant pre-fill and campaign tracking
  const scheduleUrl = `https://1slabs.my.id/schedule?company=${encodeURIComponent(companyName || '')}&email=${encodeURIComponent(cleanEmail)}&contact=${encodeURIComponent(recipientName || '')}&campaign=${campaignId || ''}`;

  // Route CTA through click & interest tracking endpoint
  const actionUrl = `${APP_URL}/api/marketing/track/click?camp=${campaignId || 0}&company=${companyId || 0}&email=${encodeURIComponent(cleanEmail)}&target=${encodeURIComponent(scheduleUrl)}`;

  const styledHtml = wrapHtmlEmail({
    title: finalSubject,
    preheader: ctaPreheader,
    content: rawBody,
    callToAction: {
      url: actionUrl,
      text: ctaText
    },
    badge: ctaBadge
  });

  // 5. Send via Nodemailer
  const transporter = getTransporter();
  let messageId = null;

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to: cleanEmail,
      subject: finalSubject,
      html: styledHtml,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'X-1sLabs-Campaign-ID': String(campaignId || 0),
        'X-1sLabs-Outreach-Type': 'B2B-Intelligence'
      }
    });

    messageId = info.messageId || null;

    // Log success with recipient details & full rendered HTML
    await query(
      `INSERT INTO marketing_email_logs 
       (campaign_id, company_id, contact_id, recipient_email, recipient_name, company_name, subject, body_html, message_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')`,
      [
        campaignId || null,
        companyId || null,
        contactId || null,
        cleanEmail,
        recipientName || null,
        companyName || null,
        finalSubject,
        styledHtml,
        messageId
      ]
    );

    // Update recipient record if campaignId provided
    if (campaignId) {
      await query(
        `UPDATE marketing_campaign_recipients 
         SET status = 'sent', sent_at = NOW() 
         WHERE campaign_id = ? AND recipient_email = ?`,
        [campaignId, cleanEmail]
      );

      // Increment campaign sent_count
      await query(
        'UPDATE marketing_campaigns SET sent_count = sent_count + 1 WHERE id = ?',
        [campaignId]
      );
    }

    // Update company status to Contacted and record timestamp
    if (companyId) {
      await query(
        `UPDATE marketing_companies 
         SET status = 'Contacted', last_contacted_at = NOW(), contacted_times = contacted_times + 1, updated_at = NOW() 
         WHERE id = ?`,
        [companyId]
      );
    }

    // Update contact record if contactId provided
    if (contactId) {
      await query(
        `UPDATE marketing_contacts 
         SET last_contacted_at = NOW() 
         WHERE id = ?`,
        [contactId]
      );
    }

    return {
      success: true,
      messageId,
      recipient: cleanEmail
    };
  } catch (err) {
    // Decrement quota if sending failed on transport level so quota isn't wasted on transport crash
    await query(
      'UPDATE marketing_daily_quotas SET sent_count = GREATEST(0, sent_count - 1) WHERE quota_date = ?',
      [today]
    ).catch(() => {});

    // Log failure
    await query(
      `INSERT INTO marketing_email_logs 
       (campaign_id, company_id, contact_id, recipient_email, recipient_name, company_name, subject, body_html, status, error_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'failed', ?)`,
      [
        campaignId || null,
        companyId || null,
        contactId || null,
        cleanEmail,
        recipientName || null,
        companyName || null,
        finalSubject,
        styledHtml || rawBody,
        err.message
      ]
    ).catch(() => {});

    if (campaignId) {
      await query(
        `UPDATE marketing_campaign_recipients 
         SET status = 'failed', error_message = ? 
         WHERE campaign_id = ? AND recipient_email = ?`,
        [err.message, campaignId, cleanEmail]
      ).catch(() => {});

      await query(
        'UPDATE marketing_campaigns SET failed_count = failed_count + 1 WHERE id = ?',
        [campaignId]
      );
    }

    throw err;
  }
}

module.exports = {
  getJakartaDateString,
  getDailyQuotaStatus,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  isSuppressed,
  addToSuppressionList,
  substituteTemplateVariables,
  sendMarketingEmail
};

