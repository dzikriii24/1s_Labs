const { query } = require('../db');

/**
 * Log administrative or system action to system_activity_logs
 */
async function logActivity({
  actorId = null,
  actorName = 'System',
  actorRole = 'admin',
  action,
  target,
  details = null,
  ip = '127.0.0.1',
  result = 'success',
  conn = null
}) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details ? String(details) : null);
    const sql = `
      INSERT INTO system_activity_logs 
      (actor_id, actor_name, actor_role, action, target, details, ip_address, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      actorId,
      actorName || 'Administrator',
      actorRole || 'admin',
      action,
      target,
      detailsStr,
      ip || '127.0.0.1',
      result
    ];

    if (conn && typeof conn.query === 'function') {
      await conn.query(sql, params);
    } else {
      await query(sql, params);
    }
  } catch (error) {
    console.warn('[ActivityLogger Warning]:', error.message);
  }
}

module.exports = { logActivity };
