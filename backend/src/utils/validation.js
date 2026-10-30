/**
 * Input validation and normalization utilities for 1sLabs Hosting Platform
 */

/**
 * Validate email address format using RFC 5322 compatible regex
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  // Standard RFC 5322 regex approximation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) return false;
  if (clean.length > 191) return false;
  return true;
}

/**
 * Clean and normalize email address
 * @param {string} email 
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Normalize and validate WhatsApp / Phone number
 * Enforces valid format (e.g. 08123456789 -> 628123456789, +628123456789 -> 628123456789)
 * @param {string} phone 
 * @returns {{ valid: boolean, normalized: string, display: string, error?: string }}
 */
function validateAndNormalizeWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Nomor WhatsApp wajib diisi.'
    };
  }

  // Remove whitespace, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Strip leading plus
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Digits only check
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Nomor WhatsApp hanya boleh berisi angka.'
    };
  }

  // Convert Indonesian 08xx to 628xx
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  // Minimum 10 digits (e.g. 62812345678), Maximum 15 digits (ITU-T E.164 standard)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Panjang nomor WhatsApp tidak valid (harus 10 hingga 15 digit).'
    };
  }

  // E.164 normalized display: e.g. +62 812-3456-7890
  const display = `+${cleaned}`;

  return {
    valid: true,
    normalized: cleaned,
    display,
    error: undefined
  };
}

/**
 * Normalize domain name
 * - Lowercase
 * - Strip protocol http:// or https://
 * - Strip www.
 * - Strip paths, query strings, and port
 * - Strip trailing dots
 * @param {string} rawDomain 
 * @returns {string}
 */
function cleanDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return '';
  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//i, '');
  domain = domain.replace(/^www\./i, '');
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];
  domain = domain.split(':')[0];
  domain = domain.replace(/\.+$/, '');
  return domain;
}

/**
 * Validate domain syntax strictly
 * @param {string} domain 
 * @returns {boolean}
 */
function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const cleaned = cleanDomain(domain);
  if (cleaned.length < 3 || cleaned.length > 253) return false;

  // Domain regex: must have at least one dot, valid labels separated by dots
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  return domainRegex.test(cleaned);
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  validateAndNormalizeWhatsApp,
  cleanDomain,
  isValidDomain
};
