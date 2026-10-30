const crypto = require('crypto');

/**
 * Generate cryptographically secure random token and its SHA-256 hash
 * @param {number} expiryHours 
 * @returns {{ rawToken: string, tokenHash: string, expiresAt: Date }}
 */
function generateSecureToken(expiryHours = 24) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

/**
 * SHA-256 hash for secure token storage
 * @param {string} rawToken 
 * @returns {string}
 */
function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  generateSecureToken,
  hashToken
};
