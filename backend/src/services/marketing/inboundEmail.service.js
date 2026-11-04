const fs = require('fs');
const path = require('path');
const { query } = require('../../db');
const { classifyEmailResponse } = require('./gemini.service');
const { addToSuppressionList } = require('./marketingEmail.service');
const { getTransporter, wrapHtmlEmail } = require('../email.service');
const { formatTextToEmailHtml } = require('../../utils/emailFormatter');

const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'info@1slabs.my.id';
const FROM_NAME = process.env.MAIL_FROM_NAME || '1s Labs';
const MAILDIR_BASE = process.env.MAILDIR_INFO_PATH || '/home/u1zh8984/mail/1slabs.my.id/info';

/**
 * Decode Quoted-Printable strings
 */
function decodeQuotedPrintable(str) {
  if (!str) return '';
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    });
}

/**
 * Decode RFC2047 MIME encoded headers (=?UTF-8?B?...?= or =?UTF-8?Q?...?=)
 */
function decodeMimeHeader(header) {
  if (!header) return '';
  return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, encoding, text) => {
    const enc = encoding.toUpperCase();
    if (enc === 'B') {
      try {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'latin1');
      } catch (e) {
        return text;
      }
    } else if (enc === 'Q') {
      return decodeQuotedPrintable(text.replace(/_/g, ' '));
    }
    return text;
  });
}

/**
 * Extract clean customer reply text, stripping quoted thread lines
 */
function extractCleanReply(text) {
  if (!text) return '';
  const quoteSplitters = [
    /\r?\n(?:On|Pada)\s+.+?(?:wrote|menulis):/i,
    /\r?\n-{3,}\s*Original Message\s*-{3,}/i,
    /\r?\n_{24,}/,
    /\r?\nFrom:\s+/i
  ];

  let cleaned = text;
  for (const pattern of quoteSplitters) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      cleaned = cleaned.slice(0, match.index);
    }
  }

  const lines = cleaned.split(/\r?\n/).filter(line => !line.trim().startsWith('>'));
  return lines.join('\n').trim();
}

/**
 * Robust HTML to plain text converter that strips DOCTYPE, head, style, script, comments
 */
function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&bull;/gi, '•')
    .replace(/&rarr;/gi, '→')
    .replace(/&copy;/gi, '©')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Parse RFC 2822 email buffer/string
 */
function parseEmail(rawContent) {
  const raw = rawContent.toString('utf8');
  const headerEndPos = raw.indexOf('\r\n\r\n') !== -1 ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n');
  if (headerEndPos === -1) return null;

  const headerText = raw.slice(0, headerEndPos);
  const bodyTextRaw = raw.slice(headerEndPos + (raw.indexOf('\r\n\r\n') !== -1 ? 4 : 2));

  // Parse unfolded headers
  const unfoldedHeaders = headerText.replace(/\r?\n[ \t]+/g, ' ');
  const headers = {};
  for (const line of unfoldedHeaders.split(/\r?\n/)) {
    const colonPos = line.indexOf(':');
    if (colonPos > 0) {
      const key = line.slice(0, colonPos).trim().toLowerCase();
      const val = line.slice(colonPos + 1).trim();
      headers[key] = val;
    }
  }

  const subject = decodeMimeHeader(headers['subject'] || '');
  const fromRaw = decodeMimeHeader(headers['from'] || '');
  const toRaw = decodeMimeHeader(headers['to'] || '');
  const dateRaw = headers['date'] || '';
  const messageId = (headers['message-id'] || '').replace(/[<>]/g, '').trim();

  let fromEmail = fromRaw;
  let fromName = '';
  const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
  if (fromMatch) {
    fromName = fromMatch[1] ? fromMatch[1].trim() : '';
    fromEmail = fromMatch[2].trim();
  } else {
    fromEmail = fromRaw.replace(/[<>]/g, '').trim();
  }

  const contentType = headers['content-type'] || 'text/plain';
  let plainBody = '';
  let htmlBody = '';

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = bodyTextRaw.split('--' + boundary);

    for (const part of parts) {
      if (!part || part.trim() === '--' || part.trim() === '') continue;
      const partHeaderEnd = part.indexOf('\r\n\r\n') !== -1 ? part.indexOf('\r\n\r\n') : part.indexOf('\n\n');
      if (partHeaderEnd === -1) continue;

      const partHeader = part.slice(0, partHeaderEnd);
      const partBody = part.slice(partHeaderEnd + (part.indexOf('\r\n\r\n') !== -1 ? 4 : 2));

      const isHtml = /content-type:[^\n]*text\/html/i.test(partHeader);
      const isPlain = /content-type:[^\n]*text\/plain/i.test(partHeader);
      const isQP = /content-transfer-encoding:[^\n]*quoted-printable/i.test(partHeader);
      const isB64 = /content-transfer-encoding:[^\n]*base64/i.test(partHeader);

      let decoded = partBody;
      if (isQP) {
        decoded = decodeQuotedPrintable(partBody);
      } else if (isB64) {
        try {
          decoded = Buffer.from(partBody.replace(/\s/g, ''), 'base64').toString('utf8');
        } catch (e) {}
      }

      // Check for nested boundary inside alternative
      const subBoundaryMatch = partHeader.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
      if (subBoundaryMatch) {
        const subBoundary = subBoundaryMatch[1] || subBoundaryMatch[2];
        const subParts = partBody.split('--' + subBoundary);
        for (const sp of subParts) {
          const spEnd = sp.indexOf('\r\n\r\n') !== -1 ? sp.indexOf('\r\n\r\n') : sp.indexOf('\n\n');
          if (spEnd === -1) continue;
          const spH = sp.slice(0, spEnd);
          const spB = sp.slice(spEnd + (sp.indexOf('\r\n\r\n') !== -1 ? 4 : 2));
          const spIsHtml = /content-type:[^\n]*text\/html/i.test(spH);
          const spIsPlain = /content-type:[^\n]*text\/plain/i.test(spH);
          const spIsQP = /content-transfer-encoding:[^\n]*quoted-printable/i.test(spH);
          const spIsB64 = /content-transfer-encoding:[^\n]*base64/i.test(spH);
          let spDecoded = spB;
          if (spIsQP) spDecoded = decodeQuotedPrintable(spB);
          else if (spIsB64) {
            try { spDecoded = Buffer.from(spB.replace(/\s/g, ''), 'base64').toString('utf8'); } catch (e) {}
          }
          if (spIsPlain && !plainBody) plainBody = spDecoded;
          if (spIsHtml && !htmlBody) htmlBody = spDecoded;
        }
      } else {
        if (isPlain && !plainBody) plainBody = decoded;
        if (isHtml && !htmlBody) htmlBody = decoded;
      }
    }
  } else {
    const isQP = /content-transfer-encoding:[^\n]*quoted-printable/i.test(headerText);
    const isB64 = /content-transfer-encoding:[^\n]*base64/i.test(headerText);
    let decoded = bodyTextRaw;
    if (isQP) decoded = decodeQuotedPrintable(bodyTextRaw);
    else if (isB64) {
      try { decoded = Buffer.from(bodyTextRaw.replace(/\s/g, ''), 'base64').toString('utf8'); } catch (e) {}
    }
    if (/content-type:[^\n]*text\/html/i.test(headerText)) {
      htmlBody = decoded;
    } else {
      plainBody = decoded;
    }
  }

  const cleanReply = extractCleanReply(plainBody || htmlToPlainText(htmlBody));

  return {
    fromEmail,
    fromName,
    to: toRaw,
    subject,
    date: dateRaw ? new Date(dateRaw) : new Date(),
    messageId,
    bodyText: cleanReply || plainBody.trim() || htmlToPlainText(htmlBody),
    fullBodyText: plainBody.trim() || htmlToPlainText(htmlBody),
    bodyHtml: htmlBody
  };
}

/**
 * Rule-based fallback classifier if Gemini is unavailable
 */
function ruleBasedClassifier(bodyText, subject) {
  const combined = (subject + ' ' + bodyText).toLowerCase();

  if (/(?:unsub|berhenti|jangan kirim|stop|hapus email|optout)/i.test(combined)) {
    return {
      classification: 'Unsubscribe',
      sentiment: 'negative',
      summary: 'Prospek meminta berhenti berlangganan atau stop email.',
      suggested_action: 'Hentikan pengiriman email (masuk Suppression List).'
    };
  }
  if (/(?:tertarik|minat|boleh|jadwalkan|meeting|diskusi|vmeet|zoom|call|lanjut)/i.test(combined)) {
    return {
      classification: 'Interested',
      sentiment: 'positive',
      summary: 'Prospek menyatakan tertarik dan siap untuk berdiskusi lebih lanjut.',
      suggested_action: 'Kirim link jadwal diskusi meeting atau follow up via WhatsApp.'
    };
  }
  if (/(?:harga|biaya|tarif|biayanya|budget|pric|paket|proposal)/i.test(combined)) {
    return {
      classification: 'Asking for Pricing',
      sentiment: 'positive',
      summary: 'Prospek menanyakan rincian harga atau penawaran paket layanan.',
      suggested_action: 'Kirimkan proposal penawaran harga dan benefit paket.'
    };
  }
  if (/(?:info|katalog|detail|portofolio|contoh)/i.test(combined)) {
    return {
      classification: 'Requesting Information',
      sentiment: 'neutral',
      summary: 'Prospek meminta informasi tambahan atau portofolio pekerjaan.',
      suggested_action: 'Kirimkan company profile dan portofolio proyek.'
    };
  }
  if (/(?:tidak|ga minat|belum butuh|tolak|maaf)/i.test(combined)) {
    return {
      classification: 'Not Interested',
      sentiment: 'negative',
      summary: 'Prospek menyatakan belum membutuhkan layanan saat ini.',
      suggested_action: 'Tandai Not Interested dan simpan untuk re-engagement di masa depan.'
    };
  }

  return {
    classification: 'Other',
    sentiment: 'neutral',
    summary: 'Prospek mengirimkan balasan pesan.',
    suggested_action: 'Tinjau isi pesan dan siapkan respon manual.'
  };
}

/**
 * Scan Maildir directories (new and cur) and sync inbound emails into DB
 */
async function syncMaildirInbox() {
  const folders = ['new', 'cur'];
  let totalScanned = 0;
  let importedCount = 0;
  const importedList = [];

  for (const folder of folders) {
    const dirPath = path.join(MAILDIR_BASE, folder);
    if (!fs.existsSync(dirPath)) continue;

    let files = [];
    try {
      files = fs.readdirSync(dirPath);
    } catch (e) {
      console.warn(`[InboundEmail] Could not read directory ${dirPath}:`, e.message);
      continue;
    }

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        totalScanned++;

        // Fast check if already imported by filename
        const [existingByFile] = await query(
          'SELECT id FROM marketing_email_replies WHERE source_file = ? LIMIT 1',
          [file]
        );
        if (existingByFile) continue;

        const content = fs.readFileSync(fullPath);
        const parsed = parseEmail(content);
        if (!parsed || !parsed.fromEmail) continue;

        // Skip internal/system automated messages
        const fromEmailLower = parsed.fromEmail.toLowerCase();
        if (
          fromEmailLower === FROM_ADDRESS.toLowerCase() ||
          fromEmailLower.includes('cpanel@') ||
          fromEmailLower.includes('mailer-daemon@') ||
          fromEmailLower.includes('postmaster@') ||
          fromEmailLower.includes('noreply@') ||
          fromEmailLower.includes('no-reply@')
        ) {
          continue;
        }

        // Check if messageId already exists in DB
        if (parsed.messageId) {
          const [existingByMsg] = await query(
            'SELECT id FROM marketing_email_replies WHERE message_id = ? LIMIT 1',
            [parsed.messageId]
          );
          if (existingByMsg) continue;
        }

        // Match with company in database
        const [company] = await query(
          `SELECT id, name, category, lead_score FROM marketing_companies 
           WHERE LOWER(email) = ? LIMIT 1`,
          [fromEmailLower]
        );

        // Match with latest outreach email log
        const [lastLog] = await query(
          `SELECT id, campaign_id, company_id, contact_id, subject FROM marketing_email_logs 
           WHERE LOWER(recipient_email) = ? ORDER BY sent_at DESC LIMIT 1`,
          [fromEmailLower]
        );

        const campaignId = lastLog ? lastLog.campaign_id : null;
        const companyId = company ? company.id : (lastLog ? lastLog.company_id : null);
        const contactId = lastLog ? lastLog.contact_id : null;
        const originalLogId = lastLog ? lastLog.id : null;

        // Classify response using Gemini AI with rule-based fallback
        let classificationResult = null;
        try {
          classificationResult = await classifyEmailResponse(
            parsed.bodyText,
            parsed.subject,
            company ? company.name : ''
          );
        } catch (e) {
          // Gemini error, fallback to rules
        }

        if (!classificationResult || !classificationResult.classification) {
          classificationResult = ruleBasedClassifier(parsed.bodyText, parsed.subject);
        }

        const classification = classificationResult.classification || 'Other';
        const sentiment = classificationResult.sentiment || 'neutral';
        const aiSummary = classificationResult.summary || null;

        // Insert into marketing_email_replies
        const insertRes = await query(
          `INSERT INTO marketing_email_replies 
           (campaign_id, company_id, contact_id, original_email_log_id, from_email, from_name, 
            subject, body_text, body_html, received_at, classification, ai_summary, sentiment, 
            status, message_id, source_file)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?)`,
          [
            campaignId,
            companyId,
            contactId,
            originalLogId,
            parsed.fromEmail,
            parsed.fromName || null,
            parsed.subject || '(Tanpa Subjek)',
            parsed.bodyText || '',
            parsed.bodyHtml || null,
            parsed.date,
            classification,
            aiSummary,
            sentiment,
            parsed.messageId || null,
            file
          ]
        );

        importedCount++;
        importedList.push({
          id: insertRes.insertId,
          from_email: parsed.fromEmail,
          from_name: parsed.fromName,
          subject: parsed.subject,
          classification,
          sentiment
        });

        // Update campaign statistics
        if (campaignId) {
          await query(
            'UPDATE marketing_campaigns SET responded_count = responded_count + 1 WHERE id = ?',
            [campaignId]
          );

          if (classification === 'Interested' || classification === 'Consultation Requested') {
            await query(
              'UPDATE marketing_campaigns SET interested_count = interested_count + 1 WHERE id = ?',
              [campaignId]
            );
          }

          await query(
            `UPDATE marketing_campaign_recipients 
             SET status = 'responded', response_at = NOW() 
             WHERE campaign_id = ? AND LOWER(recipient_email) = ?`,
            [campaignId, fromEmailLower]
          );
        }

        // Update company CRM status
        if (companyId) {
          const newStatus = (classification === 'Interested' || classification === 'Consultation Requested')
            ? 'Interested'
            : (classification === 'Not Interested' ? 'Not Interested' : 'Responded');

          await query(
            `UPDATE marketing_companies 
             SET status = ?,
                 lead_score = GREATEST(lead_score, ?),
                 lead_grade = CASE WHEN ? = 'Interested' THEN 'hot' ELSE lead_grade END,
                 updated_at = NOW() 
             WHERE id = ?`,
            [newStatus, classification === 'Interested' ? 90 : 75, newStatus, companyId]
          );
        }

        // Auto add to suppression list if Unsubscribe
        if (classification === 'Unsubscribe' || classificationResult.is_opt_out) {
          await addToSuppressionList(parsed.fromEmail, 'unsubscribe', 'Auto-unsubscribed from inbound email response', 'inbound_ai').catch(() => {});
        }
      } catch (err) {
        console.error(`[InboundEmail] Error processing mail file ${file}:`, err);
      }
    }
  }

  return {
    scanned: totalScanned,
    imported: importedCount,
    newReplies: importedList
  };
}

/**
 * Get conversation threads grouped per customer
 */
async function getConversationThreads(search = '') {
  // 1. Get all distinct customer emails from replies and logs
  const customerEmails = await query(`
    SELECT DISTINCT email FROM (
      SELECT LOWER(from_email) as email FROM marketing_email_replies
      UNION
      SELECT LOWER(recipient_email) as email FROM marketing_email_logs
    ) as combined
    WHERE email IS NOT NULL AND email != '' AND email != ?
    ORDER BY email ASC
  `, [FROM_ADDRESS.toLowerCase()]);

  const threads = [];

  for (const { email } of customerEmails) {
    // Get replies for this customer
    const replies = await query(
      `SELECT r.*, c.name as comp_name, c.phone as comp_phone, c.city as comp_city, c.status as comp_status
       FROM marketing_email_replies r
       LEFT JOIN marketing_companies c ON r.company_id = c.id
       WHERE LOWER(r.from_email) = ?
       ORDER BY r.received_at ASC`,
      [email]
    );

    // Get outgoing logs for this customer
    const logs = await query(
      `SELECT l.*, c.name as comp_name, c.phone as comp_phone, c.city as comp_city, c.status as comp_status
       FROM marketing_email_logs l
       LEFT JOIN marketing_companies c ON l.company_id = c.id
       WHERE LOWER(l.recipient_email) = ?
       ORDER BY l.sent_at ASC`,
      [email]
    );

    if (replies.length === 0 && logs.length === 0) continue;

    // Get company details
    const [company] = await query(
      `SELECT id, name, category, phone, whatsapp_number, city, status, lead_score, lead_grade
       FROM marketing_companies 
       WHERE LOWER(email) = ? LIMIT 1`,
      [email]
    );

    // Build timeline messages
    const messages = [];

    logs.forEach(l => {
      const plainText = htmlToPlainText(l.body_html || '');
      messages.push({
        id: `log-${l.id}`,
        db_id: l.id,
        direction: 'outgoing', // Sent by 1sLabs
        sender_name: FROM_NAME,
        sender_email: FROM_ADDRESS,
        recipient_email: l.recipient_email,
        subject: l.subject,
        body: plainText,
        body_html: l.body_html || '',
        timestamp: l.sent_at,
        status: l.status
      });
    });

    replies.forEach(r => {
      const cleanBody = r.body_text || htmlToPlainText(r.body_html || '');
      messages.push({
        id: `reply-${r.id}`,
        db_id: r.id,
        direction: 'incoming', // Received from customer
        sender_name: r.from_name || company?.name || r.from_email,
        sender_email: r.from_email,
        recipient_email: FROM_ADDRESS,
        subject: r.subject,
        body: cleanBody,
        body_html: r.body_html || '',
        timestamp: r.received_at,
        classification: r.classification,
        sentiment: r.sentiment,
        ai_summary: r.ai_summary,
        status: r.status,
        admin_notes: r.admin_notes
      });
    });

    // Sort all messages chronologically
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const latestMessage = messages[messages.length - 1];
    const latestReply = replies[replies.length - 1];
    const unreadCount = replies.filter(r => r.status === 'unread').length;

    const threadObj = {
      customer_email: email,
      customer_name: (latestReply && latestReply.from_name) || company?.name || email.split('@')[0],
      company_id: company?.id || (latestReply?.company_id) || null,
      company_name: company?.name || null,
      company_category: company?.category || null,
      company_phone: company?.phone || company?.whatsapp_number || null,
      company_status: company?.status || 'Contacted',
      unread_count: unreadCount,
      last_message_text: latestMessage.body.slice(0, 160),
      last_message_at: latestMessage.timestamp,
      last_direction: latestMessage.direction,
      classification: latestReply ? latestReply.classification : 'No Reply',
      sentiment: latestReply ? latestReply.sentiment : 'neutral',
      ai_summary: latestReply ? latestReply.ai_summary : null,
      message_count: messages.length,
      messages
    };

    // Filter by search if provided
    if (search) {
      const q = search.toLowerCase();
      const matchEmail = email.includes(q);
      const matchName = threadObj.customer_name?.toLowerCase().includes(q);
      const matchComp = threadObj.company_name?.toLowerCase().includes(q);
      const matchSubj = messages.some(m => m.subject?.toLowerCase().includes(q) || m.body?.toLowerCase().includes(q));
      if (!matchEmail && !matchName && !matchComp && !matchSubj) continue;
    }

    threads.push(threadObj);
  }

  // Sort threads by latest message timestamp DESC
  threads.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

  return threads;
}

/**
 * Send a direct reply to customer from the inbox chat
 */
async function sendDirectCustomerReply({ recipient_email, recipient_name, company_id, subject, message_text, in_reply_to }) {
  if (!recipient_email || !message_text) {
    throw new Error('Recipient email dan pesan tidak boleh kosong.');
  }

  const cleanEmail = recipient_email.trim().toLowerCase();
  const finalSubject = subject ? (subject.startsWith('Re:') ? subject : `Re: ${subject}`) : 'Tanggapan dari 1sLabs';

  // Format HTML message with paragraphs, bold, and list styling
  const formattedBody = formatTextToEmailHtml(message_text);
  const styledContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #18181b;">
      <p style="margin: 0 0 16px 0; line-height: 1.65; color: #18181b; font-size: 14px;">Halo <strong style="color: #09090b; font-weight: 700;">${recipient_name || cleanEmail}</strong>,</p>
      ${formattedBody}
      <p style="margin-top: 24px; color: #52525b; font-size: 13px; line-height: 1.6;">
        Salam hangat,<br>
        <strong style="color: #18181b;">Tim 1sLabs</strong><br>
        <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">1slabs.my.id</a> &bull; WhatsApp: +62 851-5629-6580
      </p>
    </div>
  `;

  const finalHtml = wrapHtmlEmail({
    title: finalSubject,
    preheader: message_text.slice(0, 100),
    content: styledContent,
    badge: 'Pesan Tim 1sLabs'
  });

  const transporter = getTransporter();
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to: cleanEmail,
    subject: finalSubject,
    text: `${message_text}\n\n---\n1sLabs Team\nhttps://1slabs.my.id`,
    html: finalHtml,
    headers: {
      'X-1sLabs-Direct-Reply': 'true'
    }
  };

  if (in_reply_to) {
    mailOptions.inReplyTo = in_reply_to;
    mailOptions.references = in_reply_to;
  }

  const info = await transporter.sendMail(mailOptions);
  const messageId = info.messageId || null;

  // Insert to marketing_email_logs
  const logRes = await query(
    `INSERT INTO marketing_email_logs 
     (company_id, recipient_email, recipient_name, subject, body_html, message_id, status, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW())`,
    [
      company_id || null,
      cleanEmail,
      recipient_name || null,
      finalSubject,
      finalHtml,
      messageId
    ]
  );

  // Mark all unread replies for this customer as read / replied
  await query(
    `UPDATE marketing_email_replies 
     SET status = 'replied' 
     WHERE LOWER(from_email) = ? AND status = 'unread'`,
    [cleanEmail]
  );

  // Update company last contacted
  if (company_id) {
    await query(
      `UPDATE marketing_companies 
       SET last_contacted_at = NOW(), contacted_times = contacted_times + 1, updated_at = NOW() 
       WHERE id = ?`,
      [company_id]
    );
  }

  return {
    success: true,
    log_id: logRes.insertId,
    messageId,
    recipient_email: cleanEmail,
    sent_at: new Date()
  };
}

module.exports = {
  parseEmail,
  syncMaildirInbox,
  getConversationThreads,
  sendDirectCustomerReply
};
