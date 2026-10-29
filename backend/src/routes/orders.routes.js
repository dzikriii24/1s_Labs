const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateOrderNumber, generatePaymentNumber } = require('../utils/helpers');

// POST /orders - Create new order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { plan_id, type = 'new', related_service_id, customer_notes } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Paket hosting wajib dipilih.'
      });
    }

    // Fetch plan details
    const plans = await query(
      'SELECT id, name, price, period, is_active FROM hosting_plans WHERE id = ?',
      [plan_id]
    );

    if (plans.length === 0 || !plans[0].is_active) {
      return res.status(404).json({
        success: false,
        message: 'Paket hosting tidak ditemukan atau tidak aktif.'
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

    // Execute atomic transaction
    const result = await withTransaction(async (conn) => {
      // 1. Insert order with price snapshot (total including PPN 11%)
      const [orderInsert] = await conn.query(
        `INSERT INTO orders 
        (order_number, user_id, plan_id, plan_name_snapshot, price_snapshot, period_snapshot, type, related_service_id, status, customer_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
        [
          orderNumber,
          req.user.id,
          plan.id,
          plan.name,
          totalAmount,
          plan.period,
          type,
          type === 'renewal' ? related_service_id : null,
          customer_notes ? customer_notes.trim() : null
        ]
      );

      const orderId = orderInsert.insertId;

      // 2. Insert payment record with total amount
      const [paymentInsert] = await conn.query(
        `INSERT INTO payments 
        (payment_number, order_id, user_id, amount, method, status)
        VALUES (?, ?, ?, ?, 'qris', 'unpaid')`,
        [paymentNumber, orderId, req.user.id, totalAmount]
      );

      return {
        orderId,
        paymentId: paymentInsert.insertId,
        orderNumber,
        paymentNumber,
        basePrice,
        ppnAmount,
        amount: totalAmount,
        planName: plan.name,
        period: plan.period
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat. Silakan lanjutkan ke pembayaran QRIS.',
      order: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat pesanan.'
    });
  }
});

// Auto expire unpaid orders older than 24 hours
async function checkAndExpireOldOrders() {
  try {
    await query("UPDATE orders SET status = 'expired', updated_at = NOW() WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 24 HOUR");
    await query("UPDATE payments SET status = 'expired', updated_at = NOW() WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 24 HOUR");
  } catch (err) {
    console.warn('[orders] Auto-expire notice:', err.message);
  }
}

// GET /orders - List orders
router.get('/', requireAuth, async (req, res) => {
  try {
    await checkAndExpireOldOrders();

    const isUserAdmin = req.user.role === 'admin';
    const { status } = req.query;

    let sql = `
      SELECT o.id, o.order_number, o.user_id, o.plan_id, o.plan_name_snapshot, o.plan_name_snapshot as plan_name,
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

// POST /orders/:orderNumber/cancel - Cancel unpaid order
router.post('/:orderNumber/cancel', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const isUserAdmin = req.user.role === 'admin';

    let sql = 'SELECT id, user_id, status FROM orders WHERE order_number = ?';
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

    await query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [order.id]);
    await query("UPDATE payments SET status = 'expired', updated_at = NOW() WHERE order_id = ? AND status = 'unpaid'", [order.id]);

    return res.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan.'
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
             s.id as service_id, s.service_code, s.domain, s.status as service_status
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
