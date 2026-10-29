const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f';

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Sesi login tidak ditemukan.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token otentikasi tidak valid.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await query('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', [decoded.id]);
    
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan atau sesi telah berakhir.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Otentikasi gagal atau token tidak sah.'
    });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const users = await query('SELECT id, email, name, phone, role FROM users WHERE id = ?', [decoded.id]);
      if (users && users.length > 0) {
        req.user = users[0];
      }
    }
  } catch (err) {
    // ignore token errors for optional auth
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses terbatas untuk administrator sistem.'
    });
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  JWT_SECRET
};
