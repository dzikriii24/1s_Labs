const crypto = require('crypto');

function generateOrderNumber() {
  const d = new Date();
  const dateStr = d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

function generatePaymentNumber() {
  const d = new Date();
  const dateStr = d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PAY-${dateStr}-${rand}`;
}

function generateInvoiceNumber() {
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${dateStr}-${rand}`;
}

function generateServiceCode() {
  const d = new Date();
  const year = d.getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SRV-${year}-${rand}`;
}

function formatRupiah(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const clean = domain.trim().toLowerCase();
  // Must not have protocol or slashes
  if (clean.includes('://') || clean.includes('/') || clean.includes(':')) {
    return false;
  }
  // Standard domain regex (letters, numbers, hyphens, dots, valid TLD of at least 2 chars)
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,24}$/i;
  return domainRegex.test(clean);
}

function cleanDomain(domain) {
  if (!domain) return '';
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:.*$/, '');
}

function calculateDaysRemaining(expiryDate) {
  if (!expiryDate) return 0;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

module.exports = {
  generateOrderNumber,
  generatePaymentNumber,
  generateInvoiceNumber,
  generateServiceCode,
  formatRupiah,
  isValidDomain,
  cleanDomain,
  calculateDaysRemaining
};
