const nodemailer = require('nodemailer');
const path = require('path');
const { query } = require('../db');
const { wrapHtmlEmail } = require('./email.service');
const { formatTextToEmailHtml } = require('../utils/emailFormatter');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const HR_EMAIL_ADDRESS = process.env.HR_MAIL_ADDRESS || 'hr@1slabs.my.id';
const HR_FROM_NAME = process.env.HR_MAIL_NAME || '1sLabs Recruitment';
const APP_URL = process.env.BASE_URL || 'https://1slabs.my.id';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailHost = process.env.MAIL_HOST || 'smtp-relay.brevo.com';
  const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
  const mailSecure = process.env.MAIL_SECURE === 'true' || mailPort === 465;
  const mailUser = process.env.MAIL_USERNAME || process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASSWORD || process.env.MAIL_PASS;

  const transportConfig = {
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    tls: {
      rejectUnauthorized: false
    }
  };

  if (mailUser && mailPass) {
    transportConfig.auth = {
      user: mailUser,
      pass: mailPass
    };
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

/**
 * Replace dynamic placeholders in text or HTML
 */
function replacePlaceholders(content, variables = {}) {
  if (!content) return '';
  let replaced = String(content);

  const defaultVars = {
    company_name: '1sLabs',
    hr_email: HR_EMAIL_ADDRESS,
    app_url: APP_URL,
    ...variables
  };

  for (const [key, value] of Object.entries(defaultVars)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      replaced = replaced.replace(regex, String(value));
    }
  }

  return replaced;
}

/**
 * Clean plain text fallback from HTML
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send an individual HR email to a candidate
 */
async function sendHREmail({
  candidateId = null,
  campaignId = null,
  to,
  toName = '',
  subject,
  htmlContent,
  textContent,
  variables = {},
  badge = '1sLabs HR & Recruitment'
}) {
  const cleanTo = String(to).trim().toLowerCase();
  const replacedSubject = replacePlaceholders(subject, variables);
  // 1. Substitute variables into content FIRST so placeholders like {{scheduling_link}} become actual links
  const contentWithVars = replacePlaceholders(htmlContent, variables);
  // 2. Format markdown/plain text to styled HTML (including CTA buttons)
  const formattedHtml = formatTextToEmailHtml(contentWithVars);
  // 3. Fallback check for any residual placeholders
  const replacedBody = replacePlaceholders(formattedHtml, variables);

  const wrappedHtml = wrapHtmlEmail({
    title: replacedSubject,
    preheader: stripHtml(replacedBody).slice(0, 150),
    content: replacedBody,
    badge
  });

  const plainText = textContent
    ? replacePlaceholders(textContent, variables)
    : stripHtml(replacedBody);

  let messageId = null;
  let status = 'sent';
  let errorMessage = null;

  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: `"${HR_FROM_NAME}" <${HR_EMAIL_ADDRESS}>`,
      replyTo: HR_EMAIL_ADDRESS,
      to: cleanTo,
      subject: replacedSubject,
      text: plainText,
      html: wrappedHtml,
      headers: {
        'X-Recruitment-Source': '1sLabs-HR-Platform',
        'X-Candidate-ID': candidateId ? String(candidateId) : 'none'
      }
    });

    messageId = info.messageId || null;
  } catch (err) {
    console.error(`[HREmailService] Failed to send email to ${cleanTo}:`, err.message);
    status = 'failed';
    errorMessage = err.message;
  }

  // Record into hr_email_logs
  try {
    await query(
      `INSERT INTO hr_email_logs 
       (campaign_id, candidate_id, recipient_email, recipient_name, sender_email, subject, body_html, status, message_id, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        campaignId,
        candidateId,
        cleanTo,
        toName || null,
        HR_EMAIL_ADDRESS,
        replacedSubject,
        wrappedHtml,
        status,
        messageId,
        errorMessage
      ]
    );
  } catch (dbErr) {
    console.warn('[HREmailService] Failed to write hr_email_logs:', dbErr.message);
  }

  // Update candidate status and activity
  if (candidateId) {
    try {
      if (status === 'sent') {
        await query(
          `UPDATE hr_candidates 
           SET email_status = 'sent', last_activity_at = NOW() 
           WHERE id = ?`,
          [candidateId]
        );

        await query(
          `INSERT INTO hr_candidate_activities 
           (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
           VALUES (?, 'email_sent', ?, ?, ?, 'HR System', NOW())`,
          [
            candidateId,
            `Email Terkirim: ${replacedSubject.slice(0, 100)}`,
            `Email rekrutmen berhasil dikirim ke ${cleanTo}.`,
            JSON.stringify({ messageId, subject: replacedSubject, sender: HR_EMAIL_ADDRESS })
          ]
        );
      } else {
        await query(
          `UPDATE hr_candidates 
           SET email_status = 'failed', last_activity_at = NOW() 
           WHERE id = ?`,
          [candidateId]
        );

        await query(
          `INSERT INTO hr_candidate_activities 
           (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
           VALUES (?, 'manual', 'Gagal Mengirim Email Rekrutmen', ?, ?, 'HR System', NOW())`,
          [
            candidateId,
            `Gagal mengirim email: ${errorMessage}`,
            JSON.stringify({ error: errorMessage, subject: replacedSubject })
          ]
        );
      }
    } catch (candDbErr) {
      console.warn('[HREmailService] Failed to update candidate record:', candDbErr.message);
    }
  }

  return {
    success: status === 'sent',
    messageId,
    error: errorMessage
  };
}

/**
 * Throttled bulk email dispatcher for candidates
 * Guarantees individual email sending (no CC/BCC privacy leaks)
 */
async function sendBulkHREmails({
  candidateIds = [],
  templateKey = null,
  customSubject = '',
  customBody = '',
  campaignTitle = 'Rekrutmen Massal'
}) {
  if (!candidateIds || candidateIds.length === 0) {
    throw new Error('Tidak ada kandidat yang dipilih untuk pengiriman email.');
  }

  // Load template if provided
  let template = null;
  if (templateKey) {
    const [found] = await query(
      'SELECT * FROM hr_email_templates WHERE template_key = ? LIMIT 1',
      [templateKey]
    );
    template = found || null;
  }

  const subjectTemplate = customSubject || (template ? template.subject : 'Pemberitahuan Rekrutmen 1sLabs');
  const rawBody = customBody || (template ? template.body_html : 'Pemberitahuan rekrutmen resmi dari 1sLabs.');
  const bodyTemplate = formatTextToEmailHtml(rawBody);

  // Create Campaign Record
  const campaignRes = await query(
    `INSERT INTO hr_email_campaigns 
     (title, template_id, subject, body_html, total_recipients, sent_count, failed_count, status, created_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, 'processing', NOW())`,
    [
      campaignTitle,
      template ? template.id : null,
      subjectTemplate,
      bodyTemplate,
      candidateIds.length
    ]
  );
  const campaignId = campaignRes.insertId;

  // Fetch candidate details with position
  const placeholders = candidateIds.map(() => '?').join(',');
  const candidates = await query(
    `SELECT c.id, c.full_name, c.email, c.phone, c.recruitment_status, p.name AS position_name
     FROM hr_candidates c
     LEFT JOIN hr_positions p ON c.position_id = p.id
     WHERE c.id IN (${placeholders})`,
    candidateIds
  );

  let sentCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const candidate of candidates) {
    try {
      // Find or generate pending interview token if needed for {{scheduling_link}}
      let schedulingLink = '';
      if (rawBody.includes('{{scheduling_link}}') || bodyTemplate.includes('{{scheduling_link}}') || subjectTemplate.includes('{{scheduling_link}}')) {
        const [existingInterview] = await query(
          `SELECT scheduling_token FROM hr_interviews 
           WHERE candidate_id = ? AND status IN ('pending_selection', 'scheduled') 
           ORDER BY id DESC LIMIT 1`,
          [candidate.id]
        );

        let token = existingInterview?.scheduling_token;
        if (!token) {
          const crypto = require('crypto');
          token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
          await query(
            `INSERT INTO hr_interviews 
             (candidate_id, position_id, scheduling_token, token_expires_at, status, created_at)
             VALUES (?, (SELECT position_id FROM hr_candidates WHERE id = ?), ?, ?, 'pending_selection', NOW())`,
            [candidate.id, candidate.id, token, expiresAt]
          );
        }
        schedulingLink = `${APP_URL}/interview/schedule/${token}`;
      }

      const variables = {
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        position_name: candidate.position_name || 'Posisi di 1sLabs',
        scheduling_link: schedulingLink
      };

      const result = await sendHREmail({
        candidateId: candidate.id,
        campaignId,
        to: candidate.email,
        toName: candidate.full_name,
        subject: subjectTemplate,
        htmlContent: rawBody,
        variables
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
        errors.push({ email: candidate.email, error: result.error });
      }

      // Small throttling delay to ensure server and relay stability (150ms)
      await new Promise(r => setTimeout(r, 150));
    } catch (sendErr) {
      failedCount++;
      errors.push({ email: candidate.email, error: sendErr.message });
    }
  }

  // Update Campaign Status
  await query(
    `UPDATE hr_email_campaigns 
     SET sent_count = ?, failed_count = ?, status = 'completed' 
     WHERE id = ?`,
    [sentCount, failedCount, campaignId]
  );

  return {
    success: true,
    campaignId,
    total: candidateIds.length,
    sent: sentCount,
    failed: failedCount,
    errors
  };
}

module.exports = {
  HR_EMAIL_ADDRESS,
  HR_FROM_NAME,
  getTransporter,
  replacePlaceholders,
  stripHtml,
  sendHREmail,
  sendBulkHREmails
};

