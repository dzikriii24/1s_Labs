const https = require('https');
const http = require('http');
const tls = require('tls');
const { query } = require('../../db');

/**
 * Conduct a non-intrusive, privacy-compliant website audit for a business prospect
 */
async function auditCompanyWebsite(companyId, websiteUrl) {
  if (!websiteUrl) {
    return {
      has_website: false,
      lead_score: 25,
      grade: 'cold',
      breakdown: { no_website: 25 }
    };
  }

  let formattedUrl = websiteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const startTime = Date.now();
  let httpStatus = null;
  let sslValid = false;
  let sslIssuer = null;
  let sslExpiryDate = null;
  let loadTimeMs = null;
  let isResponsive = false;
  let hasContactPage = false;
  let hasCatalog = false;
  const techStack = [];
  const findings = [];

  try {
    // 1. Fetch homepage with timeout
    const parsed = new URL(formattedUrl);
    const isHttps = parsed.protocol === 'https:';

    const response = await fetch(formattedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 1sLabs-Business-Checker/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    loadTimeMs = Date.now() - startTime;
    httpStatus = response.status;

    // 2. SSL Inspection if HTTPS
    if (isHttps) {
      try {
        const sslInfo = await checkSslCertificate(parsed.hostname);
        sslValid = sslInfo.valid;
        sslIssuer = sslInfo.issuer;
        sslExpiryDate = sslInfo.expiryDate;
      } catch (sslErr) {
        sslValid = false;
        findings.push(`SSL Error: ${sslErr.message}`);
      }
    }

    // 3. Inspect HTML content
    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Responsive viewport check
    if (lowerHtml.includes('name="viewport"') || lowerHtml.includes("name='viewport'")) {
      isResponsive = true;
    } else {
      findings.push('Halaman tidak memiliki meta viewport (potensi tidak mobile friendly).');
    }

    // Contact page detection
    if (
      lowerHtml.includes('/contact') || 
      lowerHtml.includes('/hubungi') || 
      lowerHtml.includes('hubungi kami') || 
      lowerHtml.includes('contact us')
    ) {
      hasContactPage = true;
    }

    // Catalog detection
    if (
      lowerHtml.includes('/katalog') || 
      lowerHtml.includes('/catalog') || 
      lowerHtml.includes('/produk') || 
      lowerHtml.includes('/menu') || 
      lowerHtml.includes('/services')
    ) {
      hasCatalog = true;
    }

    // Basic technology signatures
    if (lowerHtml.includes('wp-content') || lowerHtml.includes('wordpress')) techStack.push('WordPress');
    if (lowerHtml.includes('shopify')) techStack.push('Shopify');
    if (lowerHtml.includes('_next') || lowerHtml.includes('__next')) techStack.push('Next.js');
    if (lowerHtml.includes('react')) techStack.push('React');
    if (lowerHtml.includes('laravel')) techStack.push('Laravel');
    if (lowerHtml.includes('tailwind')) techStack.push('Tailwind CSS');
    if (lowerHtml.includes('bootstrap')) techStack.push('Bootstrap');
    if (lowerHtml.includes('wix.com')) techStack.push('Wix');

    if (loadTimeMs > 3500) {
      findings.push(`Waktu muat website relatif lambat (${(loadTimeMs / 1000).toFixed(2)} detik).`);
    }

    if (httpStatus >= 400) {
      findings.push(`Website mengembalikan status HTTP error ${httpStatus}.`);
    }

  } catch (netErr) {
    httpStatus = 0;
    findings.push(`Koneksi ke website gagal atau timeout: ${netErr.message}`);
  }

  // 4. Calculate evidence-based lead score
  let score = 0;
  const breakdown = {};

  if (!httpStatus || httpStatus >= 400) {
    score += 20;
    breakdown.website_error = 20;
  }
  if (!sslValid) {
    score += 10;
    breakdown.ssl_invalid = 10;
  }
  if (!isResponsive) {
    score += 20;
    breakdown.not_responsive = 20;
  }
  if (loadTimeMs && loadTimeMs > 3500) {
    score += 15;
    breakdown.slow_performance = 15;
  }
  if (!hasCatalog) {
    score += 10;
    breakdown.no_digital_catalog = 10;
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  let grade = 'cold';
  if (score >= 80) grade = 'hot';
  else if (score >= 50) grade = 'warm';

  // 5. Store audit record in marketing_website_audits
  if (companyId) {
    await query(
      `INSERT INTO marketing_website_audits 
       (company_id, website_url, http_status, ssl_valid, ssl_issuer, ssl_expiry_date, load_time_ms, is_responsive, has_contact_page, has_catalog, tech_stack_json, audit_findings_json, audit_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        formattedUrl,
        httpStatus,
        sslValid ? 1 : 0,
        sslIssuer,
        sslExpiryDate,
        loadTimeMs,
        isResponsive ? 1 : 0,
        hasContactPage ? 1 : 0,
        hasCatalog ? 1 : 0,
        JSON.stringify(techStack),
        JSON.stringify(findings),
        score
      ]
    );

    // Update marketing_companies table with audit findings
    await query(
      `UPDATE marketing_companies 
       SET has_website = 1,
           website_status = ?,
           ssl_status = ?,
           is_mobile_responsive = ?,
           performance_score = ?,
           last_website_checked = NOW(),
           digital_presence_findings = ?,
           lead_score = GREATEST(COALESCE(lead_score, 0), ?),
           lead_grade = ?,
           lead_score_breakdown = ?
       WHERE id = ?`,
      [
        httpStatus === 200 ? 'active' : 'error',
        sslValid ? 'valid' : 'invalid',
        isResponsive ? 1 : 0,
        loadTimeMs ? Math.max(10, Math.min(100, Math.round(100 - (loadTimeMs / 100)))) : null,
        findings.join(' | '),
        score,
        grade,
        JSON.stringify(breakdown),
        companyId
      ]
    );
  }

  return {
    website_url: formattedUrl,
    http_status: httpStatus,
    ssl_valid: sslValid,
    ssl_issuer: sslIssuer,
    load_time_ms: loadTimeMs,
    is_responsive: isResponsive,
    has_contact_page: hasContactPage,
    has_catalog: hasCatalog,
    tech_stack: techStack,
    findings,
    lead_score: score,
    grade,
    breakdown
  };
}

/**
 * Helper to inspect SSL certificate validity & expiry
 */
function checkSslCertificate(hostname) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        timeout: 6000
      },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          return resolve({ valid: false, issuer: null, expiryDate: null });
        }

        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const isNotExpired = validTo ? validTo.getTime() > Date.now() : false;

        resolve({
          valid: authorized && isNotExpired,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown CA',
          expiryDate: validTo ? validTo.toISOString().slice(0, 10) : null
        });
      }
    );

    socket.on('error', (err) => {
      resolve({ valid: false, issuer: null, expiryDate: null, error: err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ valid: false, issuer: null, expiryDate: null, error: 'SSL timeout' });
    });
  });
}

module.exports = {
  auditCompanyWebsite,
  checkSslCertificate
};

