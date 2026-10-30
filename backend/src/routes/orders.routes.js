const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth, requireVerifiedEmail } = require('../middleware/auth');
const { generateOrderNumber, generatePaymentNumber } = require('../utils/helpers');
const { cleanDomain, isValidDomain } = require('../utils/validation');
const { domainService } = require('../services/cpanel.service');
const {
  sendOrderCreatedEmail,
  sendAdminNewOrderNotification
} = require('../services/email.service');

// Auto-expire unpaid orders older than 24 hours & release their domain reservations
async function checkAndExpireOldOrders() {
  try {
    await query(`
      UPDATE orders 
      SET status = 'expired', updated_at = NOW() 
      WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 24 HOUR
    `);
    await query(`
      UPDATE payments 
      SET status = 'expired', updated_at = NOW() 
      WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 24 HOUR
    `);
    await query(`
      UPDATE domain_reservations 
      SET status = 'released', updated_at = NOW() 
      WHERE status = 'pending_payment' AND reserved_until < NOW()
    `);
  } catch (err) {
    console.warn('[orders] Auto-expire notice:', err.message);
  }
}

// POST & GET /orders/check-domain - Real-time domain validation & internal collision check
const handleCheckDomain = async (req, res) => {
  try {
    const domain = req.body?.domain || req.query?.domain;
    if (!domain) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Nama domain wajib diisi.'
      });
    }

    const cleaned = cleanDomain(domain);
    if (!isValidDomain(cleaned)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Format nama domain tidak valid. Contoh format: tokosaya.com atau perusahaan.co.id'
      });
    }

    await checkAndExpireOldOrders();

    // 1. Check existing active/pending hosting services
    const [existingService] = await query(
      `SELECT id FROM hosting_services WHERE domain = ? AND status IN ('active', 'pending_provisioning', 'awaiting_domain') LIMIT 1`,
      [cleaned]
    );

    if (existingService) {
      return res.status(409).json({
        success: false,
        available: false,
        message: 'Domain ini sudah terdaftar pada layanan hosting aktif di platform 1sLabs. Silakan gunakan nama domain lain.'
      });
    }

    // 2. Check pending active reservations by another user
    const [existingReservation] = await query(
      `SELECT id, user_id FROM domain_reservations 
       WHERE domain = ? AND status = 'pending_payment' AND reserved_until > NOW() AND user_id != ? LIMIT 1`,
      [cleaned, req.user.id]
    );

    if (existingReservation) {
      return res.status(409).json({
        success: false,
        available: false,
        message: 'Domain ini sedang dalam proses pemesanan oleh pelanggan lain pada sistem kami. Silakan pilih domain lain.'
      });
    }

    return res.json({
      success: true,
      available: true,
      domain: cleaned,
      message: `Domain ${cleaned} tersedia untuk didaftarkan pada hosting 1sLabs!`
    });
  } catch (error) {
    console.error('Check domain error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memeriksa ketersediaan domain.'
    });
  }
};

router.post('/check-domain', requireAuth, handleCheckDomain);
router.get('/check-domain', requireAuth, handleCheckDomain);

// POST /orders - Create new order (Requires Verified Email and Valid WhatsApp)
router.post('/', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    await checkAndExpireOldOrders();

    const { plan_id, domain, domain_type = 'existing', type = 'new', related_service_id, customer_notes } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Paket hosting wajib dipilih.'
      });
    }

    // Domain is MANDATORY during checkout
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Nama domain untuk layanan hosting wajib diisi.'
      });
    }

    const cleanedDomain = cleanDomain(domain);
    if (!isValidDomain(cleanedDomain)) {
      return res.status(400).json({
        success: false,
        message: 'Format nama domain tidak valid. Pastikan penulisan domain benar (contoh: bisnisanda.com).'
      });
    }

    // Verify user has WhatsApp number
    if (!req.user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp wajib dilengkapi pada profil Anda sebelum melakukan checkout.'
      });
    }

    // Fetch authoritative plan details from database (NEVER trust frontend price)
    const plans = await query(
      'SELECT id, name, price, period, is_active FROM hosting_plans WHERE id = ?',
      [plan_id]
    );

    if (plans.length === 0 || !plans[0].is_active) {
      return res.status(404).json({
        success: false,
        message: 'Paket hosting tidak ditemukan atau sudah tidak aktif.'
      });
    }

    const plan = plans[0];
    const orderNumber = generateOrderNumber();
    const paymentNumber = generatePaymentNumber();

    // If renewal, verify related service exists and belongs to user
    if (type === 'renewal') {
      if (!related_service_id) {
        return res.status(400).json({
          success: false,
          message: 'ID layanan yang akan diperpanjang wajib disertakan.'
        });
      }
      const services = await query(
        'SELECT id, domain, expires_at FROM hosting_services WHERE id = ? AND user_id = ?',
        [related_service_id, req.user.id]
      );
      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Layanan hosting yang akan diperpanjang tidak ditemukan.'
        });
      }
    }

    const basePrice = parseFloat(plan.price);
    const ppnAmount = Math.round(basePrice * 0.11);
    const totalAmount = basePrice + ppnAmount;

    // Execute atomic reservation & order creation in transaction
    const result = await withTransaction(async (conn) => {
      // 1. Lock and check domain uniqueness
      const [serviceConflict] = await conn.query(
        `SELECT id FROM hosting_services 
         WHERE domain = ? AND status IN ('active', 'pending_provisioning', 'awaiting_domain') FOR UPDATE`,
        [cleanedDomain]
      );

      if (serviceConflict.length > 0 && type !== 'renewal') {
        throw new Error(`Domain ${cleanedDomain} sudah terdaftar pada layanan hosting aktif di platform 1sLabs.`);
      }

      const [resConflict] = await conn.query(
        `SELECT id FROM domain_reservations 
         WHERE domain = ? AND status = 'pending_payment' AND reserved_until > NOW() AND user_id != ? FOR UPDATE`,
        [cleanedDomain, req.user.id]
      );

      if (resConflict.length > 0) {
        throw new Error(`Domain ${cleanedDomain} sedang dalam proses pemesanan oleh pelanggan lain pada sistem kami.`);
      }

      // 2. Insert order record with authoritative pricing snapshot & domain
      const [orderInsert] = await conn.query(
        `INSERT INTO orders 
        (order_number, user_id, plan_id, domain, domain_type, plan_name_snapshot, price_snapshot, period_snapshot, type, related_service_id, status, customer_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
        [
          orderNumber,
          req.user.id,
          plan.id,
          cleanedDomain,
          domain_type,
          plan.name,
          totalAmount,
          plan.period,
          type,
          type === 'renewal' ? related_service_id : null,
          customer_notes ? customer_notes.trim() : null
        ]
      );

      const orderId = orderInsert.insertId;

      // 3. Insert payment record
      const [paymentInsert] = await conn.query(
        `INSERT INTO payments 
        (payment_number, order_id, user_id, amount, method, status)
        VALUES (?, ?, ?, ?, 'qris', 'unpaid')`,
        [paymentNumber, orderId, req.user.id, totalAmount]
      );

      // 4. Reserve domain for 24 hours
      await conn.query(
        `INSERT INTO domain_reservations (domain, user_id, order_id, status, reserved_until)
         VALUES (?, ?, ?, 'pending_payment', DATE_ADD(NOW(), INTERVAL 24 HOUR))
         ON DUPLICATE KEY UPDATE 
           user_id = VALUES(user_id),
           order_id = VALUES(order_id),
           status = 'pending_payment',
           reserved_until = DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
        [cleanedDomain, req.user.id, orderId]
      );

      return {
        orderId,
        paymentId: paymentInsert.insertId,
        orderNumber,
        paymentNumber,
        domain: cleanedDomain,
        basePrice,
        ppnAmount,
        amount: totalAmount,
        planName: plan.name,
        period: plan.period
      };
    });

    // Send customer order confirmation email asynchronously
    sendOrderCreatedEmail({
      to: req.user.email,
      name: req.user.name,
      order: { order_number: orderNumber },
      plan,
      domain: cleanedDomain,
      amount: totalAmount
    }).catch(err => console.error('[orders] Background customer email error:', err.message));

    // Send admin notification to dzikrirabbani2401@gmail.com
    sendAdminNewOrderNotification({
      order: { order_number: orderNumber },
      user: req.user,
      plan,
      domain: cleanedDomain,
      amount: totalAmount
    }).catch(err => console.error('[orders] Background admin email error:', err.message));

    // Proactively register addon domain into cPanel Jupiter Domains & create docroot
    if (cleanedDomain) {
      domainService.addAddonDomain(cleanedDomain)
        .then(() => console.log(`[orders] Proactively registered addon domain in cPanel: ${cleanedDomain}`))
        .catch(cpErr => console.warn(`[orders] cPanel addon notice for '${cleanedDomain}':`, cpErr.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Pesanan hosting berhasil dibuat. Silakan lanjutkan ke pembayaran QRIS.',
      order: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(error.message.includes('Domain') ? 409 : 500).json({
      success: false,
      message: error.message || 'Gagal membuat pesanan hosting.'
    });
  }
});

// GET /orders - List orders
router.get('/', requireAuth, async (req, res) => {
  try {
    await checkAndExpireOldOrders();

    const isUserAdmin = req.user.role === 'admin';
    const { status } = req.query;

    let sql = `
      SELECT o.id, o.order_number, o.user_id, o.plan_id, o.domain, o.domain_type,
             o.plan_name_snapshot, o.plan_name_snapshot as plan_name,
             o.price_snapshot, o.price_snapshot as total_amount,
             o.period_snapshot, o.period_snapshot as period, o.type, o.status, o.customer_notes, o.created_at,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             p.id as payment_id, p.payment_number, p.status as payment_status, p.proof_image
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN (
        SELECT p1.*
        FROM payments p1
        INNER JOIN (
          SELECT order_id, MAX(id) as max_id
          FROM payments
          GROUP BY order_id
        ) p2 ON p1.id = p2.max_id
      ) p ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' AND o.user_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await query(sql, params);
    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar pesanan.'
    });
  }
});

// POST /orders/:orderNumber/cancel - Cancel unpaid order and release reserved domain
router.post('/:orderNumber/cancel', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = 'SELECT id, user_id, domain, status FROM orders WHERE order_number = ?';
    const params = [orderNumber];

    if (!isUserAdmin) {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    const order = rows[0];
    if (order.status !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Hanya pesanan yang berstatus belum lunas (unpaid) yang dapat dibatalkan.'
      });
    }

    await withTransaction(async (conn) => {
      await conn.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [order.id]);
      await conn.query("UPDATE payments SET status = 'expired', updated_at = NOW() WHERE order_id = ? AND status = 'unpaid'", [order.id]);
      if (order.domain) {
        await conn.query("UPDATE domain_reservations SET status = 'released', updated_at = NOW() WHERE domain = ?", [order.domain]);
      }
    });

    return res.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan dan reservasi domain telah dilepaskan.'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membatalkan pesanan.'
    });
  }
});

// GET /orders/:orderNumber - Order detail
router.get('/:orderNumber', requireAuth, async (req, res) => {
  try {
    await checkAndExpireOldOrders();

    const { orderNumber } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             p.id as payment_id, p.payment_number, p.amount as payment_amount, p.status as payment_status,
             p.proof_image, p.sender_bank_or_wallet, p.sender_account_name, p.notes as payment_notes,
             p.rejection_reason, p.verified_at,
             s.id as service_id, s.service_code, s.domain as active_service_domain, s.status as service_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN hosting_services s ON s.order_id = o.id
      WHERE o.order_number = ?
    `;
    const params = [orderNumber];

    if (!isUserAdmin) {
      sql += ' AND o.user_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      order: rows[0]
    });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail pesanan.'
    });
  }
});

module.exports = router;
