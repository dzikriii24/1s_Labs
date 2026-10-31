const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /invoices - List invoices
router.get('/', requireAuth, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    let sql = `
      SELECT inv.*, u.name as customer_name, u.email as customer_email,
             o.order_number, s.service_code
      FROM invoices inv
      JOIN users u ON inv.user_id = u.id
      JOIN orders o ON inv.order_id = o.id
      LEFT JOIN hosting_services s ON inv.service_id = s.id
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' WHERE inv.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY inv.created_at DESC';

    const invoices = await query(sql, params);
    return res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar invoice.'
    });
  }
});

// GET /invoices/:invoiceNumber - Single invoice detail (Accessible by auth user, admin, or via direct link)
router.get('/:invoiceNumber', optionalAuth, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const isUserAdmin = req.user && req.user.role === 'admin';

    let sql = `
      SELECT inv.*,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             o.order_number, o.created_at as order_created_at, o.domain as order_domain,
             p.payment_number, p.method as payment_method, p.verified_at,
             p.proof_image as payment_proof_image, p.sender_bank_or_wallet, p.sender_account_name,
             s.service_code, s.domain as current_service_domain
      FROM invoices inv
      JOIN users u ON inv.user_id = u.id
      JOIN orders o ON inv.order_id = o.id
      LEFT JOIN payments p ON inv.payment_id = p.id
      LEFT JOIN hosting_services s ON inv.service_id = s.id
      WHERE inv.invoice_number = ?
    `;
    const params = [invoiceNumber];

    if (req.user && !isUserAdmin) {
      sql += ' AND inv.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice tidak ditemukan atau Anda tidak berwenang melihatnya.'
      });
    }

    const invoice = rows[0];

    const companyInfo = {
      name: '1sLabs Technology',
      tagline: 'High-Performance Cloud & Software Engineering',
      website: 'https://1slabs.my.id',
      email: 'info@1slabs.my.id',
      phone: '+62 851-5629-6580',
      address: 'Bandung, Jawa Barat, Indonesia'
    };

    return res.json({
      success: true,
      invoice,
      company: companyInfo
    });
  } catch (error) {
    console.error('Fetch invoice detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail invoice.'
    });
  }
});

module.exports = router;
