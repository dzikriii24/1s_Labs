const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generateInvoiceNumber, generateServiceCode } = require('../utils/helpers');
const { ensureServiceRoot } = require('../utils/fileSandbox');

// All routes here require admin access
router.use(requireAuth, requireAdmin);

// GET /admin/stats - Admin Dashboard Metrics
router.get('/stats', async (req, res) => {
  try {
    const [customers] = await query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const [orders] = await query("SELECT COUNT(*) as count FROM orders");
    const [pendingPayments] = await query("SELECT COUNT(*) as count FROM payments WHERE status = 'pending_verification'");
    const [paidPayments] = await query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue FROM payments WHERE status = 'paid'");
    const [activeServices] = await query("SELECT COUNT(*) as count FROM hosting_services WHERE status = 'active'");
    const [awaitingServices] = await query("SELECT COUNT(*) as count FROM hosting_services WHERE status IN ('awaiting_domain', 'pending_provisioning')");
    const [expiringServices] = await query(
      "SELECT COUNT(*) as count FROM hosting_services WHERE status = 'active' AND expires_at <= DATE_ADD(NOW(), INTERVAL 14 DAY) AND expires_at >= NOW()"
    );

    return res.json({
      success: true,
      stats: {
        totalCustomers: customers?.count || 0,
        totalOrders: orders?.count || 0,
        pendingPayments: pendingPayments?.count || 0,
        paidPayments: paidPayments?.count || 0,
        totalRevenue: parseFloat(paidPayments?.revenue || 0),
        activeServices: activeServices?.count || 0,
        awaitingServices: awaitingServices?.count || 0,
        expiringServices: expiringServices?.count || 0
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat ringkasan statistik admin.'
    });
  }
});

// GET /admin/payments - List payments for verification
router.get('/payments', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT p.*, o.order_number, o.type as order_type, o.plan_name_snapshot, o.period_snapshot,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             admin.name as verified_by_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users admin ON p.verified_by = admin.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (o.order_number LIKE ? OR p.payment_number LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY p.created_at DESC';

    const payments = await query(sql, params);
    return res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Admin fetch payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data pembayaran.'
    });
  }
});

// POST /admin/payments/:id/verify - Approve or Reject payment
router.post('/payments/:id/verify', async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Aksi tidak valid. Pilihan yang tersedia: approve atau reject.'
      });
    }

    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan pembayaran wajib dicantumkan.'
      });
    }

    // Fetch current payment and order
    const payments = await query(
      `SELECT p.*, o.order_number, o.user_id as order_user_id, o.plan_id, o.plan_name_snapshot,
              o.period_snapshot, o.type as order_type, o.related_service_id
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan.'
      });
    }

    const payment = payments[0];

    // Prevent duplicate approval
    if (payment.status === 'paid' && action === 'approve') {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran ini sudah diverifikasi dan berstatus lunas sebelumnya.'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Execute atomic verification
    const verificationResult = await withTransaction(async (conn) => {
      if (action === 'approve') {
        // 1. Update payment status to paid
        await conn.query(
          `UPDATE payments 
           SET status = 'paid', verified_by = ?, verified_at = NOW(), rejection_reason = NULL, updated_at = NOW()
           WHERE id = ?`,
          [req.user.id, payment.id]
        );

        // 2. Update order status to paid
        await conn.query(
          "UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = ?",
          [payment.order_id]
        );

        let createdServiceId = null;
        let serviceCode = null;

        if (payment.order_type === 'new') {
          // Check if service already exists
          const [existingServices] = await conn.query(
            'SELECT id, service_code FROM hosting_services WHERE order_id = ?',
            [payment.order_id]
          );

          if (existingServices.length > 0) {
            createdServiceId = existingServices[0].id;
            serviceCode = existingServices[0].service_code;
          } else {
            serviceCode = generateServiceCode();
            const [serviceInsert] = await conn.query(
              `INSERT INTO hosting_services 
              (service_code, user_id, plan_id, order_id, status, server_ip, nameservers, activated_at, expires_at)
              VALUES (?, ?, ?, ?, 'awaiting_domain', '194.233.65.45', 'ns1.serverphp.my.id, ns2.serverphp.my.id', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
              [serviceCode, payment.user_id, payment.plan_id, payment.order_id]
            );
            createdServiceId = serviceInsert.insertId;

            // Log service event
            await conn.query(
              `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
               VALUES (?, 'service_created', 'Layanan Hosting Dibuat', 'Pembayaran QRIS diverifikasi oleh admin. Menunggu pelanggan mengisi domain layanan.', 'admin', ?)`,
              [createdServiceId, req.user.id]
            );
          }
        } else if (payment.order_type === 'renewal' && payment.related_service_id) {
          createdServiceId = payment.related_service_id;
          // Extend renewal
          await conn.query(
            `UPDATE hosting_services 
             SET expires_at = CASE 
               WHEN expires_at > NOW() THEN DATE_ADD(expires_at, INTERVAL 1 YEAR)
               ELSE DATE_ADD(NOW(), INTERVAL 1 YEAR)
             END,
             status = 'active',
             updated_at = NOW()
             WHERE id = ?`,
            [payment.related_service_id]
          );

          await conn.query(
            `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
             VALUES (?, 'service_renewed', 'Perpanjangan Berhasil', 'Pembayaran perpanjangan 1 tahun telah diverifikasi oleh admin.', 'admin', ?)`,
            [payment.related_service_id, req.user.id]
          );
        }

        // 3. Generate invoice if not already generated
        const [existingInvoices] = await conn.query(
          'SELECT id, invoice_number FROM invoices WHERE order_id = ?',
          [payment.order_id]
        );

        let invoiceNumber;
        if (existingInvoices.length > 0) {
          invoiceNumber = existingInvoices[0].invoice_number;
          await conn.query(
            "UPDATE invoices SET status = 'paid', paid_at = NOW(), service_id = ? WHERE id = ?",
            [createdServiceId, existingInvoices[0].id]
          );
        } else {
          invoiceNumber = generateInvoiceNumber();
          await conn.query(
            `INSERT INTO invoices 
            (invoice_number, order_id, payment_id, user_id, service_id, amount, status, plan_name, period, paid_at)
            VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, NOW())`,
            [
              invoiceNumber,
              payment.order_id,
              payment.id,
              payment.user_id,
              createdServiceId,
              payment.amount,
              payment.plan_name_snapshot,
              payment.period_snapshot
            ]
          );
        }

        // 4. Audit log
        await conn.query(
          `INSERT INTO payment_verification_logs (payment_id, admin_id, action, previous_status, new_status, reason, ip_address)
           VALUES (?, ?, 'approve', ?, 'paid', 'Pembayaran QRIS diverifikasi sah.', ?)`,
          [payment.id, req.user.id, payment.status, ipAddress]
        );

        return {
          status: 'paid',
          invoiceNumber,
          serviceCode,
          serviceId: createdServiceId
        };
      } else {
        // Reject
        await conn.query(
          `UPDATE payments 
           SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [reason.trim(), req.user.id, payment.id]
        );

        await conn.query(
          "UPDATE orders SET status = 'unpaid', updated_at = NOW() WHERE id = ?",
          [payment.order_id]
        );

        await conn.query(
          `INSERT INTO payment_verification_logs (payment_id, admin_id, action, previous_status, new_status, reason, ip_address)
           VALUES (?, ?, 'reject', ?, 'rejected', ?, ?)`,
          [payment.id, req.user.id, payment.status, reason.trim(), ipAddress]
        );

        return {
          status: 'rejected',
          reason: reason.trim()
        };
      }
    });

    return res.json({
      success: true,
      message: action === 'approve' ? 'Pembayaran berhasil disetujui.' : 'Pembayaran telah ditolak.',
      result: verificationResult
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses verifikasi pembayaran.'
    });
  }
});

// GET /admin/services - List all services
router.get('/services', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT s.*, p.name as plan_name, p.storage_gb, p.databases_count,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             o.order_number
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      JOIN orders o ON s.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (s.service_code LIKE ? OR s.domain LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY s.created_at DESC';

    const services = await query(sql, params);
    return res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Admin fetch services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat layanan hosting.'
    });
  }
});

// PUT /admin/services/:id/provision - Update provisioning status & details
router.put('/services/:id/provision', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { status, cpanel_username, admin_notes, server_ip, nameservers, domain } = req.body;

    const services = await query('SELECT * FROM hosting_services WHERE id = ?', [serviceId]);
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layanan hosting tidak ditemukan.'
      });
    }

    const current = services[0];
    const newStatus = status || current.status;

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE hosting_services 
         SET status = ?,
             cpanel_username = COALESCE(?, cpanel_username),
             admin_notes = ?,
             server_ip = COALESCE(?, server_ip),
             nameservers = COALESCE(?, nameservers),
             domain = COALESCE(?, domain),
             updated_at = NOW()
         WHERE id = ?`,
        [
          newStatus,
          cpanel_username ? cpanel_username.trim() : null,
          admin_notes ? admin_notes.trim() : null,
          server_ip ? server_ip.trim() : null,
          nameservers ? nameservers.trim() : null,
          domain ? domain.trim() : null,
          serviceId
        ]
      );

      if (newStatus !== current.status) {
        let title = 'Status Layanan Diperbarui';
        let desc = `Status layanan diubah dari ${current.status} menjadi ${newStatus}.`;
        if (newStatus === 'active') {
          title = 'Hosting Aktif';
          desc = `Layanan hosting telah selesai dikonfigurasi dan aktif digunakan di server 1sLabs.`;
          try {
            ensureServiceRoot(current.service_code, domain || current.domain || 'website-anda.com');
          } catch (e) {
            console.error('ensureServiceRoot error on provision:', e);
          }
        } else if (newStatus === 'suspended') {
          title = 'Layanan Ditangguhkan';
          desc = `Layanan hosting ditangguhkan oleh administrator.`;
        }

        await conn.query(
          `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
           VALUES (?, 'status_changed', ?, ?, 'admin', ?)`,
          [serviceId, title, desc, req.user.id]
        );
      }
    });

    return res.json({
      success: true,
      message: 'Konfigurasi layanan berhasil disimpan.'
    });
  } catch (error) {
    console.error('Update service provision error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui konfigurasi layanan.'
    });
  }
});

// GET /admin/plans - All plans for admin management
router.get('/plans', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM hosting_plans ORDER BY display_order ASC');
    const formatted = plans.map(p => ({
      ...p,
      features: typeof p.features_json === 'string' ? JSON.parse(p.features_json) : (p.features_json || [])
    }));
    return res.json({
      success: true,
      plans: formatted
    });
  } catch (error) {
    console.error('Admin fetch plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar paket hosting.'
    });
  }
});

// PUT /admin/plans/:id - Update plan
router.put('/plans/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const {
      name,
      target,
      price,
      period,
      description,
      storage_gb,
      databases_count,
      bandwidth,
      ssl_type,
      backup_frequency,
      email_accounts,
      is_recommended,
      is_active,
      display_order,
      features
    } = req.body;

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : JSON.stringify([]);

    await query(
      `UPDATE hosting_plans 
       SET name = ?, target = ?, price = ?, period = ?, description = ?,
           storage_gb = ?, databases_count = ?,
           bandwidth = COALESCE(?, bandwidth),
           ssl_type = COALESCE(?, ssl_type),
           backup_frequency = COALESCE(?, backup_frequency),
           email_accounts = COALESCE(?, email_accounts),
           is_recommended = ?, is_active = ?,
           display_order = ?, features_json = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        target,
        price,
        period || '/ tahun',
        description,
        storage_gb,
        databases_count,
        bandwidth !== undefined ? bandwidth : null,
        ssl_type !== undefined ? ssl_type : null,
        backup_frequency !== undefined ? backup_frequency : null,
        email_accounts !== undefined ? email_accounts : null,
        is_recommended ? 1 : 0,
        is_active ? 1 : 0,
        display_order || 0,
        featuresJson,
        planId
      ]
    );

    return res.json({
      success: true,
      message: 'Paket hosting berhasil diperbarui.'
    });
  } catch (error) {
    console.error('Update plan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui paket hosting.'
    });
  }
});

// GET /admin/customers - List registered customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             COUNT(DISTINCT o.id) as orders_count,
             COUNT(DISTINCT s.id) as services_count,
             COALESCE(SUM(p.amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN hosting_services s ON s.user_id = u.id
      LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'paid'
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Admin fetch customers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar pelanggan.'
    });
  }
});

module.exports = router;
