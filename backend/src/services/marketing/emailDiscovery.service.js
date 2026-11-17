const dns = require('dns').promises;
const { query } = require('../../db');
const { isSuppressed } = require('./marketingEmail.service');

// RFC 5322 compliant regex for practical email extraction
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Ignored false positives (common web assets / trackers / vendors)
const IGNORED_DOMAINS = [
  'sentry.io',
  'example.com',
  'domain.com',
  'w3.org',
  'schema.org',
  'google.com',
  'facebook.com',
  'cloudflare.com',
  'gravatar.com',
  'wordpress.org',
  'jsdelivr.net',
  'unpkg.com',
  'github.com'
];

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js'];

/**
 * Standardize and clean extracted email
 */
function cleanExtractedEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  let email = rawEmail.trim().toLowerCase();

  // Strip trailing punctuation
  email = email.replace(/^[<(\['"]+/, '').replace(/[>)\]'",.:;]+$/, '');

  // Check extensions
  for (const ext of IGNORED_EXTENSIONS) {
    if (email.endsWith(ext)) return null;
  }

  // Check domain
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1];

  if (IGNORED_DOMAINS.includes(domain)) return null;

  return email;
}

/**
 * Perform technical email validation:
 * 1. Syntax check
 * 2. Domain resolution
 * 3. DNS MX Record lookup
 * 4. Suppression check
 */
async function validateEmailTechnical(email) {
  const cleaned = cleanExtractedEmail(email);
  if (!cleaned) {
    return {
      email,
      valid: false,
      status: 'INVALID',
      reason: 'Sintaks format email tidak valid atau domain diabaikan.'
    };
  }

  const [localPart, domain] = cleaned.split('@');

  // Check suppression
  const suppressed = await isSuppressed(cleaned);
  if (suppressed) {
    return {
      email: cleaned,
      valid: false,
      status: 'INVALID',
      suppressed: true,
      reason: 'Email terdaftar dalam Do Not Contact / Suppression list.'
    };
  }

  // Check MX records via DNS
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        email: cleaned,
        valid: false,
        status: 'INVALID',
        reason: `Domain @${domain} tidak memiliki DNS MX record aktif untuk menerima email.`
      };
    }

    // Sort by priority
    mxRecords.sort((a, b) => a.priority - b.priority);

    return {
      email: cleaned,
      valid: true,
      status: 'VERIFIED',
      domain,
      mxRecords: mxRecords.slice(0, 3),
      reason: `DNS MX Record aktif ditemukan pada server ${mxRecords[0].exchange} (Prioritas ${mxRecords[0].priority}).`
    };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'NXDOMAIN') {
      return {
        email: cleaned,
        valid: false,
        status: 'INVALID',
        errorCode: err.code,
        reason: `Domain @${domain} tidak ditemukan pada DNS publik (${err.code}).`
      };
    }

    // Temporary DNS lookup failure / timeout -> UNVERIFIED (do not mark as INVALID)
    return {
      email: cleaned,
      valid: false,
      status: 'UNVERIFIED',
      errorCode: err.code,
      reason: `Pemeriksaan DNS MX mengalami kendala jaringan atau timeout: ${err.message}`
    };
  }
}

/**
 * Safe fetch with realistic User-Agent, timeout, and redirect limits
 */
async function safeFetchHtml(url, timeoutMs = 12000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 1sLabsLeadDiscovery/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, status: response.status, html: null, url: response.url };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { ok: false, status: response.status, html: null, url: response.url, reason: 'Non-HTML content' };
    }

    // Limit buffer to 1MB to avoid memory exhaustion on shared hosting
    const text = await response.text();
    return { ok: true, status: response.status, html: text.slice(0, 1024 * 1024), url: response.url };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout' : err.message, html: null };
  }
}

/**
 * Discover official public pages (/contact, /about, /kontak, /tentang-kami) from website
 */
async function discoverCompanyEmail(company) {
  if (!company || !company.website_url) {
    return {
      companyId: company?.id,
      success: false,
      status: 'NO_EMAIL',
      message: 'Perusahaan tidak memiliki alamat website resmi.'
    };
  }

  let baseUrl = company.website_url.trim();
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl;
  }

  // 1. Check homepage
  const homeResp = await safeFetchHtml(baseUrl);
  if (!homeResp.ok) {
    // Retry with http if https failed
    if (baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('https://', 'http://');
    }
  }

  const pagesToScan = [
    { name: 'homepage', path: '' },
    { name: 'contact', path: '/contact' },
    { name: 'contact-us', path: '/contact-us' },
    { name: 'kontak', path: '/kontak' },
    { name: 'about', path: '/about' },
    { name: 'about-us', path: '/about-us' },
    { name: 'tentang-kami', path: '/tentang-kami' }
  ];

  const candidateEmails = new Map(); // email -> sourceUrl

  for (const page of pagesToScan) {
    let targetUrl = baseUrl;
    if (page.path) {
      try {
        targetUrl = new URL(page.path, baseUrl).href;
      } catch {
        continue;
      }
    }

    const pageResp = await safeFetchHtml(targetUrl, 8000);
    if (!pageResp.ok || !pageResp.html) continue;

    const matches = pageResp.html.match(EMAIL_REGEX) || [];
    for (const raw of matches) {
      const cleaned = cleanExtractedEmail(raw);
      if (cleaned && !candidateEmails.has(cleaned)) {
        candidateEmails.set(cleaned, pageResp.url || targetUrl);
      }
    }

    // Also look for mailto: links
    const mailtoMatches = pageResp.html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi) || [];
    for (const m of mailtoMatches) {
      const emailPart = m.replace(/^mailto:/i, '').split('?')[0];
      const cleaned = cleanExtractedEmail(emailPart);
      if (cleaned && !candidateEmails.has(cleaned)) {
        candidateEmails.set(cleaned, pageResp.url || targetUrl);
      }
    }

    // Short pause between page requests to avoid hitting rate limits on target site
    await new Promise(r => setTimeout(r, 200));
  }

  if (candidateEmails.size === 0) {
    // Update company status as NO_EMAIL
    await query(
      `UPDATE marketing_companies 
       SET email_status = 'NO_EMAIL', 
           website_status = 'active',
           last_website_checked = NOW() 
       WHERE id = ?`,
      [company.id]
    );

    return {
      companyId: company.id,
      companyName: company.name,
      website: baseUrl,
      success: true,
      emailStatus: 'NO_EMAIL',
      emailsFound: 0,
      message: 'Website dapat diakses, namun tidak ditemukan alamat email publik pada halaman /contact, /about, atau homepage.'
    };
  }

  // Prioritize official corporate mail prefixes: info@, contact@, sales@, halo@, admin@
  const prioritizedPrefixes = ['info@', 'contact@', 'halo@', 'sales@', 'marketing@', 'admin@', 'support@', 'office@'];
  let chosenEmail = null;
  let chosenSourceUrl = null;

  for (const [email, sourceUrl] of candidateEmails.entries()) {
    if (prioritizedPrefixes.some(p => email.startsWith(p))) {
      chosenEmail = email;
      chosenSourceUrl = sourceUrl;
      break;
    }
  }

  if (!chosenEmail) {
    // Pick the first discovered email
    const firstEntry = candidateEmails.entries().next().value;
    chosenEmail = firstEntry[0];
    chosenSourceUrl = firstEntry[1];
  }

  // Technical validation of the chosen email (syntax + DNS MX record)
  const validation = await validateEmailTechnical(chosenEmail);

  // Update company record in database
  const updateStatus = validation.status === 'VERIFIED' ? 'Verified' : company.status;
  await query(
    `UPDATE marketing_companies 
     SET email = COALESCE(email, ?),
         email_status = ?,
         email_verified_at = NOW(),
         email_source_url = ?,
         website_status = 'active',
         has_website = 1,
         last_website_checked = NOW()
     WHERE id = ?`,
    [chosenEmail, validation.status, chosenSourceUrl, company.id]
  );

  // Add all found candidate emails to marketing_contacts table
  for (const [candidateEmail, srcUrl] of candidateEmails.entries()) {
    const isPrimary = candidateEmail === chosenEmail ? 1 : 0;
    const candValidation = candidateEmail === chosenEmail ? validation : await validateEmailTechnical(candidateEmail);

    await query(
      `INSERT INTO marketing_contacts 
       (company_id, full_name, position, role_category, channel, profile_url, source_url, verification_status, is_primary, outreach_eligible, notes, contact_type, contact_value, confidence_score, source_name)
       VALUES (?, ?, ?, 'Business Representative', 'Email', ?, ?, ?, ?, ?, ?, 'email', ?, ?, 'Official Website Discovery')
       ON DUPLICATE KEY UPDATE 
         verification_status = VALUES(verification_status),
         source_url = VALUES(source_url),
         updated_at = NOW()`,
      [
        company.id,
        `Representative (${candidateEmail.split('@')[0]})`,
        'Email Korespondensi Resmi',
        baseUrl,
        srcUrl,
        candValidation.status,
        isPrimary,
        candValidation.status === 'VERIFIED' ? 1 : 0,
        candValidation.reason,
        candidateEmail,
        candValidation.status === 'VERIFIED' ? 0.95 : 0.60
      ]
    );
  }

  return {
    companyId: company.id,
    companyName: company.name,
    website: baseUrl,
    success: true,
    chosenEmail,
    emailStatus: validation.status,
    validationReason: validation.reason,
    sourceUrl: chosenSourceUrl,
    totalDiscovered: candidateEmails.size,
    allDiscovered: Array.from(candidateEmails.keys()),
    mxRecords: validation.mxRecords || []
  };
}

/**
 * Batch Email Discovery runner with resource guards
 */
async function runBatchEmailDiscovery(options = {}) {
  const limit = Math.min(50, options.limit || 15);
  const conditions = ["website_url IS NOT NULL AND website_url != ''", "is_deleted = 0", "is_archived = 0"];
  const params = [];

  if (options.status && options.status !== 'all') {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options.email_status && options.email_status !== 'all') {
    conditions.push('email_status = ?');
    params.push(options.email_status);
  } else {
    // By default target companies without email or unverified
    conditions.push("email_status IN ('NO_EMAIL', 'UNVERIFIED')");
  }

  if (options.province && options.province !== 'all') {
    conditions.push('province = ?');
    params.push(options.province);
  }

  const sql = `
    SELECT id, name, website_url, email, email_status, province, city, category, status 
    FROM marketing_companies 
    WHERE ${conditions.join(' AND ')}
    ORDER BY is_priority DESC, id ASC 
    LIMIT ${limit}
  `;

  const targetCompanies = await query(sql, params);

  const results = {
    totalProcessed: 0,
    verifiedCount: 0,
    unverifiedCount: 0,
    invalidCount: 0,
    noEmailCount: 0,
    failedCount: 0,
    details: []
  };

  for (const comp of targetCompanies) {
    try {
      const res = await discoverCompanyEmail(comp);
      results.totalProcessed++;

      if (res.emailStatus === 'VERIFIED') results.verifiedCount++;
      else if (res.emailStatus === 'UNVERIFIED') results.unverifiedCount++;
      else if (res.emailStatus === 'INVALID') results.invalidCount++;
      else if (res.emailStatus === 'NO_EMAIL') results.noEmailCount++;

      results.details.push(res);

      // Jitter delay between different company domains to avoid hosting connection throttling
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      results.failedCount++;
      results.details.push({
        companyId: comp.id,
        companyName: comp.name,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

module.exports = {
  cleanExtractedEmail,
  validateEmailTechnical,
  discoverCompanyEmail,
  runBatchEmailDiscovery
};

