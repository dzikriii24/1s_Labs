const fs = require('fs');
const path = require('path');
const { query } = require('../db');
const { HR_EMAIL_ADDRESS } = require('./hrEmail.service');

const MAILDIR_BASE = process.env.MAILDIR_HR_PATH || '/home/u1zh8984/mail/1slabs.my.id/hr';

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
 * Extract clean candidate reply text, stripping quote thread lines
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
 * Robust HTML to plain text converter
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
  const inReplyTo = (headers['in-reply-to'] || '').replace(/[<>]/g, '').trim();

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

      // Nested boundary check
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
    inReplyTo,
    bodyText: cleanReply || plainBody.trim() || htmlToPlainText(htmlBody),
    bodyHtml: htmlBody
  };
}

/**
 * Scan HR Maildir and sync incoming candidate replies
 */
async function syncHRInbox() {
  const folders = ['new', 'cur'];
  let totalScanned = 0;
  let importedCount = 0;
  const importedList = [];

  for (const folder of folders) {
    const dirPath = path.join(MAILDIR_BASE, folder);
    if (!fs.existsSync(dirPath)) {
      continue;
    }

    let files = [];
    try {
      files = fs.readdirSync(dirPath);
    } catch (e) {
      console.warn(`[HRInbound] Could not read directory ${dirPath}:`, e.message);
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
          'SELECT id FROM hr_email_replies WHERE source_file = ? LIMIT 1',
          [file]
        );
        if (existingByFile) continue;

        const content = fs.readFileSync(fullPath);
        const parsed = parseEmail(content);
        if (!parsed || !parsed.fromEmail) continue;

        const fromEmailLower = parsed.fromEmail.toLowerCase().trim();

        // Skip internal/automated cPanel messages
        if (
          fromEmailLower === HR_EMAIL_ADDRESS.toLowerCase() ||
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
            'SELECT id FROM hr_email_replies WHERE message_id = ? LIMIT 1',
            [parsed.messageId]
          );
          if (existingByMsg) continue;
        }

        // Match with candidate in database
        const [candidate] = await query(
          'SELECT id, full_name, email, recruitment_status FROM hr_candidates WHERE LOWER(email) = ? LIMIT 1',
          [fromEmailLower]
        );

        const candidateId = candidate ? candidate.id : null;

        // Insert into hr_email_replies
        const insertRes = await query(
          `INSERT INTO hr_email_replies 
           (candidate_id, from_email, from_name, subject, body_text, body_html, received_at, status, message_id, in_reply_to, source_file, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?, NOW())`,
          [
            candidateId,
            fromEmailLower,
            parsed.fromName || null,
            parsed.subject || '(Tanpa Subjek)',
            parsed.bodyText || '',
            parsed.bodyHtml || null,
            parsed.date,
            parsed.messageId || null,
            parsed.inReplyTo || null,
            file
          ]
        );

        importedCount++;
        importedList.push({
          id: insertRes.insertId,
          from_email: fromEmailLower,
          from_name: parsed.fromName,
          subject: parsed.subject,
          candidate_id: candidateId,
          candidate_name: candidate ? candidate.full_name : null
        });

        // Update candidate status and log activity
        if (candidate) {
          // Set email_status = 'replied'
          // If recruitment_status is 'new_candidate' or 'contacted', advance to 'responded'
          const shouldUpdateRecStatus = ['new_candidate', 'contacted'].includes(candidate.recruitment_status);

          await query(
            `UPDATE hr_candidates 
             SET email_status = 'replied',
                 recruitment_status = IF(? = 1, 'responded', recruitment_status),
                 last_activity_at = NOW()
             WHERE id = ?`,
            [shouldUpdateRecStatus ? 1 : 0, candidate.id]
          );

          await query(
            `INSERT INTO hr_candidate_activities 
             (candidate_id, activity_type, title, description, metadata_json, created_by, created_at)
             VALUES (?, 'email_received', ?, ?, ?, 'Candidate', NOW())`,
            [
              candidate.id,
              `Balasan Email dari Kandidat: ${parsed.subject.slice(0, 100)}`,
              parsed.bodyText.slice(0, 300),
              JSON.stringify({
                replyId: insertRes.insertId,
                subject: parsed.subject,
                from: fromEmailLower,
                messageId: parsed.messageId
              })
            ]
          );

          // Notification for HR Admin
          await query(
            `INSERT INTO hr_notifications (type, candidate_id, title, message, is_read, created_at)
             VALUES ('candidate_replied', ?, ?, ?, 0, NOW())`,
            [
              candidate.id,
              `Balasan Email: ${candidate.full_name}`,
              `Kandidat ${candidate.full_name} (${fromEmailLower}) telah membalas: "${parsed.subject}"`
            ]
          );
        } else {
          // Notification for unknown sender
          await query(
            `INSERT INTO hr_notifications (type, candidate_id, title, message, is_read, created_at)
             VALUES ('email_received', NULL, ?, ?, 0, NOW())`,
            [
              `Email Masuk HR Baru: ${fromEmailLower}`,
              `Pesan baru dari ${parsed.fromName || fromEmailLower}: "${parsed.subject}"`
            ]
          );
        }
      } catch (fileErr) {
        console.warn(`[HRInbound] Error processing file ${file}:`, fileErr.message);
      }
    }
  }

  return {
    scanned: totalScanned,
    imported: importedCount,
    items: importedList
  };
}

module.exports = {
  syncHRInbox,
  parseEmail,
  decodeMimeHeader,
  extractCleanReply
};

