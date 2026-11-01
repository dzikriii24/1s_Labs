const { query, withTransaction } = require('../../db');

/**
 * Clean & normalize Indonesian business names for fuzzy & exact matching
 * Examples:
 * "PT. Contoh Indonesia Sejahtera" -> "contoh indonesia sejahtera"
 * "CV Contoh Indonesia" -> "contoh indonesia"
 * "Contoh Indonesia, PT" -> "contoh indonesia"
 */
function normalizeBusinessName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let cleaned = name.toLowerCase().trim();

  // Strip legal suffixes and prefixes
  const entityTypes = [
    /\bpt\.?\b/g,
    /\bcv\.?\b/g,
    /\bud\.?\b/g,
    /\btbk\.?\b/g,
    /\bllc\.?\b/g,
    /\binc\.?\b/g,
    /\bltd\.?\b/g,
    /\bkoperasi\b/g,
    /\byayasan\b/g,
    /\bperum\b/g,
    /\bpersero\b/g,
    /\bgroup\b/g,
    /\bgrup\b/g
  ];

  for (const regex of entityTypes) {
    cleaned = cleaned.replace(regex, ' ');
  }

  // Remove punctuation & special characters
  cleaned = cleaned.replace(/[^\w\s]/gi, ' ');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Normalize website domain
 * "https://www.Contoh.co.id/about-us" -> "contoh.co.id"
 */
function normalizeDomain(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    let raw = url.trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'http://' + raw;
    }
    const parsed = new URL(raw);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host || null;
  } catch {
    return null;
  }
}

/**
 * Normalize Indonesian phone numbers to standard 628xxx
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62') && digits.length >= 8) {
    digits = '62' + digits;
  }
  return digits;
}

/**
 * Calculate simple Bigram Dice Coefficient for fuzzy string similarity (0.0 to 1.0)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return 0;

  const getBigrams = str => {
    const bigrams = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bg1 = getBigrams(str1);
  const bg2 = getBigrams(str2);

  let intersection = 0;
  for (const [bigram, count1] of bg1) {
    if (bg2.has(bigram)) {
      intersection += Math.min(count1, bg2.get(bigram));
    }
  }

  const total = (str1.length - 1) + (str2.length - 1);
  return (2.0 * intersection) / total;
}

/**
 * Check if a prospect candidate matches any existing company
 * Returns { isDuplicate: boolean, confidence: 'HIGH' | 'MEDIUM' | 'NONE', matchType, existingCompany }
 */
async function findPotentialDuplicate({ name, website_url, phone, email, google_place_id, city, province }) {
  const normName = normalizeBusinessName(name);
  const normDomain = normalizeDomain(website_url);
  const normPhone = normalizePhone(phone);
  const normEmail = email ? email.toLowerCase().trim() : null;

  // 1. High-confidence Exact Matches (Domain, Place ID, Phone, Email)
  if (normDomain) {
    const [domainMatch] = await query(
      'SELECT * FROM marketing_companies WHERE normalized_domain = ? LIMIT 1',
      [normDomain]
    );
    if (domainMatch) {
      return {
        isDuplicate: true,
        confidence: 'HIGH',
        matchType: 'exact_domain',
        existingCompany: domainMatch
      };
    }
  }

  if (google_place_id) {
    const [placeMatch] = await query(
      'SELECT * FROM marketing_companies WHERE google_place_id = ? LIMIT 1',
      [google_place_id]
    );
    if (placeMatch) {
      return {
        isDuplicate: true,
        confidence: 'HIGH',
        matchType: 'exact_place_id',
        existingCompany: placeMatch
      };
    }
  }

  if (normPhone && normPhone.length >= 9) {
    const [phoneMatch] = await query(
      'SELECT * FROM marketing_companies WHERE normalized_phone = ? LIMIT 1',
      [normPhone]
    );
    if (phoneMatch) {
      return {
        isDuplicate: true,
        confidence: 'HIGH',
        matchType: 'exact_phone',
        existingCompany: phoneMatch
      };
    }
  }

  if (normEmail) {
    const [emailMatch] = await query(
      'SELECT * FROM marketing_companies WHERE LOWER(email) = ? LIMIT 1',
      [normEmail]
    );
    if (emailMatch) {
      return {
        isDuplicate: true,
        confidence: 'HIGH',
        matchType: 'exact_email',
        existingCompany: emailMatch
      };
    }
  }

  // 2. Exact Normalized Name Match
  if (normName && normName.length >= 3) {
    const [nameMatch] = await query(
      'SELECT * FROM marketing_companies WHERE normalized_name = ? LIMIT 1',
      [normName]
    );
    if (nameMatch) {
      return {
        isDuplicate: true,
        confidence: 'HIGH',
        matchType: 'exact_normalized_name',
        existingCompany: nameMatch
      };
    }

    // 3. Fuzzy Name Match in same city/province
    let locationClause = '';
    const locationParams = [];
    if (city) {
      locationClause = ' AND (city = ? OR province = ?)';
      locationParams.push(city, province || city);
    } else if (province) {
      locationClause = ' AND province = ?';
      locationParams.push(province);
    }

    const candidateRows = await query(
      `SELECT * FROM marketing_companies WHERE 1=1 ${locationClause} ORDER BY id DESC LIMIT 150`,
      locationParams
    );

    for (const cand of candidateRows) {
      const similarity = stringSimilarity(normName, cand.normalized_name);
      if (similarity >= 0.88) {
        return {
          isDuplicate: true,
          confidence: 'HIGH',
          similarity,
          matchType: 'fuzzy_name_high',
          existingCompany: cand
        };
      } else if (similarity >= 0.72) {
        return {
          isDuplicate: true,
          confidence: 'MEDIUM',
          similarity,
          matchType: 'fuzzy_name_medium',
          existingCompany: cand
        };
      }
    }
  }

  return {
    isDuplicate: false,
    confidence: 'NONE',
    matchType: 'new_discovery',
    existingCompany: null
  };
}

/**
 * Merge discovered data into existing company without losing source history
 */
async function mergeCompanyData(existingCompanyId, incomingData, sourceId = null, sourceUrl = null, rawPayload = null) {
  return await withTransaction(async (conn) => {
    // 1. Update existing company with any newly found missing fields
    const updates = [];
    const params = [];

    const fieldMap = {
      description: incomingData.description,
      industry: incomingData.industry,
      province: incomingData.province,
      city: incomingData.city,
      full_address: incomingData.full_address,
      website_url: incomingData.website_url,
      phone: incomingData.phone,
      email: incomingData.email,
      google_maps_url: incomingData.google_maps_url,
      social_media_url: incomingData.social_media_url
    };

    // If website is newly found
    if (incomingData.website_url) {
      const normDomain = normalizeDomain(incomingData.website_url);
      if (normDomain) {
        updates.push('normalized_domain = COALESCE(normalized_domain, ?)');
        params.push(normDomain);
      }
    }

    if (incomingData.phone) {
      const normPhone = normalizePhone(incomingData.phone);
      if (normPhone) {
        updates.push('normalized_phone = COALESCE(normalized_phone, ?)');
        params.push(normPhone);
      }
    }

    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined && val !== null && val !== '') {
        updates.push(`${col} = COALESCE(NULLIF(${col}, ''), ?)`);
        params.push(val);
      }
    }

    // Always bump last_discovered_at & increment enrichment count if enriched
    updates.push('last_discovered_at = NOW()');
    if (incomingData.enriched) {
      updates.push('enrichment_count = enrichment_count + 1');
      updates.push('last_enriched_at = NOW()');
    }

    params.push(existingCompanyId);
    await conn.query(
      `UPDATE marketing_companies SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // 2. Attach new source history if sourceId is provided
    if (sourceId) {
      await conn.query(
        `INSERT INTO marketing_company_sources (company_id, source_id, source_url, raw_snapshot)
         VALUES (?, ?, ?, ?)`,
        [
          existingCompanyId,
          sourceId,
          sourceUrl || null,
          rawPayload ? JSON.stringify(rawPayload) : null
        ]
      );
    }

    return existingCompanyId;
  });
}

module.exports = {
  normalizeBusinessName,
  normalizeDomain,
  normalizePhone,
  stringSimilarity,
  findPotentialDuplicate,
  mergeCompanyData
};

