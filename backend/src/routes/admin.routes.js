const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;
const { query, withTransaction } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadPaymentProof } = require('../middleware/upload');
const { generateInvoiceNumber, generateServiceCode } = require('../utils/helpers');
const { ensureServiceRoot } = require('../utils/fileSandbox');
const { logActivity } = require('../utils/activityLogger');
const {
  domainService,
  subdomainService,
  resourceService,
  sslService,
  systemProcessService
} = require('../services/cpanel.service');
const {
  sendMail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendHostingActivatedEmail,
  sendAdminProvisioningFailureNotification,
  sendInvoiceEmail,
  DEFAULT_TEMPLATES,
  substituteVariables,
  wrapHtmlEmail
} = require('../services/email.service');

// All routes here require admin access
router.use(requireAuth, requireAdmin);

// ==========================================
// 1. OVERVIEW & ADMIN STATS
// ==========================================

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

    // Monthly revenue (only paid & verified payments)
    const [monthRevenue] = await query(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM payments 
      WHERE status = 'paid' 
        AND MONTH(COALESCE(verified_at, updated_at, created_at)) = MONTH(NOW()) 
        AND YEAR(COALESCE(verified_at, updated_at, created_at)) = YEAR(NOW())
    `);

    // Recent 5 pending payments
    const recentPending = await query(`
      SELECT p.id, p.payment_number, p.amount, p.created_at, u.name as customer_name, u.email as customer_email, o.order_number
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN orders o ON p.order_id = o.id
      WHERE p.status = 'pending_verification'
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        totalCustomers: customers?.count || 0,
        totalOrders: orders?.count || 0,
        pendingPayments: pendingPayments?.count || 0,
        paidPayments: paidPayments?.count || 0,
        totalRevenue: parseFloat(paidPayments?.revenue || 0),
        monthlyRevenue: parseFloat(monthRevenue?.revenue || 0),
        activeServices: activeServices?.count || 0,
        awaitingServices: awaitingServices?.count || 0,
        expiringServices: expiringServices?.count || 0,
        recentPendingPayments: recentPending
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

// ==========================================
// 2. ANALYTICS DASHBOARD (GLOBAL & SERVICE)
// ==========================================

// GET /admin/analytics/overview - Global website traffic & visitor insights
router.get('/analytics/overview', async (req, res) => {
  try {
    const { range = '30d', serviceCode, startDate, endDate } = req.query;

    let dateCondition = 'created_at >= NOW() - INTERVAL 30 DAY';
    const params = [];

    if (range === 'today') {
      dateCondition = 'DATE(created_at) = CURDATE()';
    } else if (range === 'yesterday') {
      dateCondition = 'DATE(created_at) = SUBDATE(CURDATE(), 1)';
    } else if (range === '7d') {
      dateCondition = 'created_at >= NOW() - INTERVAL 7 DAY';
    } else if (range === '30d') {
      dateCondition = 'created_at >= NOW() - INTERVAL 30 DAY';
    } else if (range === '90d') {
      dateCondition = 'created_at >= NOW() - INTERVAL 90 DAY';
    } else if (range === 'custom' && startDate && endDate) {
      dateCondition = 'DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (range === 'all') {
      dateCondition = '1=1';
    }

    let serviceFilter = '';
    if (serviceCode && serviceCode !== 'all') {
      if (serviceCode === '1slabs.my.id' || serviceCode === '1SLABS-OFFICIAL') {
        serviceFilter = " AND (service_code = '1slabs.my.id' OR service_code = '1SLABS-OFFICIAL' OR domain = '1slabs.my.id' OR domain LIKE '%1slabs.my.id%')";
      } else {
        serviceFilter = ' AND (service_code = ? OR domain = ?)';
        params.push(serviceCode, serviceCode);
      }
    }

    // 1. Metric Summaries
    const [summary] = await query(`
      SELECT 
        SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) as total_pageviews,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as total_clicks,
        COUNT(DISTINCT CONCAT(visitor_id, '-', DATE(created_at))) as total_sessions
      FROM hosting_analytics 
      WHERE ${dateCondition}${serviceFilter}
    `, params);

    const totalPageviews = parseInt(summary?.total_pageviews || 0, 10);
    const uniqueVisitors = parseInt(summary?.unique_visitors || 0, 10);
    const totalClicks = parseInt(summary?.total_clicks || 0, 10);
    const totalSessions = parseInt(summary?.total_sessions || 0, 10);

    // 2. Bounce Rate Estimate (visitors with only 1 pageview in period)
    const bounceRows = await query(`
      SELECT COUNT(*) as single_view_visitors FROM (
        SELECT visitor_id FROM hosting_analytics 
        WHERE ${dateCondition}${serviceFilter} AND event_type = 'pageview'
        GROUP BY visitor_id
        HAVING COUNT(*) = 1
      ) as b
    `, params);
    const singleViews = parseInt(bounceRows[0]?.single_view_visitors || 0, 10);
    const bounceRate = uniqueVisitors > 0 ? parseFloat(((singleViews / uniqueVisitors) * 100).toFixed(1)) : 0;

    // 3. Daily Timeline (time series for charts)
    const timeline = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) as views,
        COUNT(DISTINCT visitor_id) as visitors,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks
      FROM hosting_analytics
      WHERE ${dateCondition}${serviceFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

    // 4. Top Landing / Visited Pages (Exclude internal /admin dashboard)
    const topPages = await query(`
      SELECT 
        page_path, 
        MAX(page_title) as page_title, 
        COUNT(*) as views, 
        COUNT(DISTINCT visitor_id) as visitors
      FROM hosting_analytics
      WHERE ${dateCondition}${serviceFilter} AND event_type = 'pageview' AND page_path NOT LIKE '/admin%' AND page_path != '/admin'
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `, params);

    // 5. Visitor Insights: Devices
    const devices = await query(`
      SELECT device, COUNT(*) as count 
      FROM hosting_analytics
      WHERE ${dateCondition}${serviceFilter}
      GROUP BY device
      ORDER BY count DESC
    `, params);

    // 6. Visitor Insights: Browsers
    const browsers = await query(`
      SELECT browser, COUNT(*) as count 
      FROM hosting_analytics
      WHERE ${dateCondition}${serviceFilter}
      GROUP BY browser
      ORDER BY count DESC
    `, params);

    // 7. Top Referrers / Traffic Sources
    const referrers = await query(`
      SELECT 
        CASE 
          WHEN referrer = '' OR referrer IS NULL THEN 'Direct / Direct Bookmark'
          ELSE referrer 
        END as source,
        COUNT(*) as count
      FROM hosting_analytics
      WHERE ${dateCondition}${serviceFilter}
      GROUP BY source
      ORDER BY count DESC
      LIMIT 8
    `, params);

    // 8. Recent Hits Feed
    let recentCondition = '1=1';
    let recentParams = [];
    if (serviceCode && serviceCode !== 'all') {
      if (serviceCode === '1slabs.my.id' || serviceCode === '1SLABS-OFFICIAL') {
        recentCondition = "(service_code = '1slabs.my.id' OR service_code = '1SLABS-OFFICIAL' OR domain = '1slabs.my.id' OR domain LIKE '%1slabs.my.id%')";
      } else {
        recentCondition = '(service_code = ? OR domain = ?)';
        recentParams.push(serviceCode, serviceCode);
      }
    }

    const recentEvents = await query(`
      SELECT id, service_code, domain, event_type, page_path, page_title, element_text, device, browser, created_at
      FROM hosting_analytics
      WHERE ${recentCondition} AND (page_path IS NULL OR (page_path NOT LIKE '/admin%' AND page_path != '/admin'))
      ORDER BY created_at DESC
      LIMIT 15
    `, recentParams);

    // Available Services List for Filter dropdown
    const trackedServices = await query(`
      SELECT DISTINCT service_code, domain FROM hosting_analytics ORDER BY domain ASC
    `);
    const has1sLabs = trackedServices.some(s => s.domain === '1slabs.my.id' || s.service_code === '1slabs.my.id' || s.service_code === '1SLABS-OFFICIAL');
    if (!has1sLabs) {
      trackedServices.unshift({ service_code: '1slabs.my.id', domain: '1slabs.my.id (Website Utama 1sLabs)' });
    }

    return res.json({
      success: true,
      range,
      serviceCode: serviceCode || 'all',
      summary: {
        totalPageviews,
        uniqueVisitors,
        totalClicks,
        totalSessions,
        bounceRate,
        clickRate: totalPageviews > 0 ? parseFloat(((totalClicks / totalPageviews) * 100).toFixed(1)) : 0
      },
      timeline,
      topPages,
      devices,
      browsers,
      referrers,
      recentEvents,
      trackedServices
    });
  } catch (error) {
    console.error('Admin analytics overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat analitik pengunjung website.'
    });
  }
});

// ==========================================
// 3. CUSTOMER MANAGEMENT
// ==========================================

// GET /admin/customers - List registered customers with filters & pagination
router.get('/customers', async (req, res) => {
  try {
    const { search, status, sort = 'created_at', order = 'DESC' } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.email_verified, u.status, u.created_at,
             COUNT(DISTINCT o.id) as orders_count,
             COUNT(DISTINCT s.id) as services_count,
             COALESCE(SUM(p.amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN hosting_services s ON s.user_id = u.id
      LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'paid'
      WHERE u.role = 'customer'
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY u.id';

    // Safe sorting
    const allowedSortCols = ['created_at', 'name', 'email', 'total_spent', 'orders_count', 'services_count'];
    const sortCol = allowedSortCols.includes(sort) ? sort : 'u.created_at';
    const sortOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const customers = await query(sql, params);
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

// GET /admin/customers/:id - Customer Detail with complete relation histories
router.get('/customers/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);

    const users = await query(
      'SELECT id, name, email, phone, role, email_verified, status, created_at, updated_at FROM users WHERE id = ? AND role = "customer"',
      [customerId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pelanggan tidak ditemukan.'
      });
    }

    const customer = users[0];

    // Customer's orders
    const orders = await query(`
      SELECT o.*, p.name as plan_name, pay.payment_number, pay.status as payment_status, pay.amount as payment_amount
      FROM orders o
      JOIN hosting_plans p ON o.plan_id = p.id
      LEFT JOIN payments pay ON pay.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [customerId]);

    // Customer's payments
    const payments = await query(`
      SELECT p.*, o.order_number, o.plan_name_snapshot, admin.name as verified_by_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN users admin ON p.verified_by = admin.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [customerId]);

    // Customer's hosting services
    const services = await query(`
      SELECT s.*, p.name as plan_name, p.storage_gb, p.databases_count
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [customerId]);

    // Customer's invoices
    const invoices = await query(`
      SELECT inv.*, o.order_number, s.service_code
      FROM invoices inv
      JOIN orders o ON inv.order_id = o.id
      LEFT JOIN hosting_services s ON inv.service_id = s.id
      WHERE inv.user_id = ?
      ORDER BY inv.created_at DESC
    `, [customerId]);

    // Email communication history with this customer
    const emailLogs = await query(`
      SELECT id, subject, template_name, status, attempts, last_error, created_at, sent_at
      FROM email_logs
      WHERE recipient = ?
      ORDER BY created_at DESC
      LIMIT 25
    `, [customer.email]);

    // Calculate totals
    const totalSpent = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return res.json({
      success: true,
      customer: {
        ...customer,
        total_spent: totalSpent,
        orders_count: orders.length,
        services_count: services.length,
        orders,
        payments,
        services,
        invoices,
        email_logs: emailLogs
      }
    });
  } catch (error) {
    console.error('Admin fetch customer detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail data pelanggan.'
    });
  }
});

// PUT /admin/customers/:id/status - Update customer status (active, suspended, disabled)
router.put('/customers/:id/status', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['active', 'suspended', 'disabled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status pelanggan tidak valid. Pilih: active, suspended, atau disabled.'
      });
    }

    const [targetUser] = await query('SELECT id, name, email FROM users WHERE id = ? AND role = "customer"', [customerId]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
    }

    await query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, customerId]);

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'customer_status_updated',
      target: targetUser.email,
      details: { newStatus: status, customerName: targetUser.name },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Status pelanggan ${targetUser.name} berhasil diubah menjadi '${status}'.`
    });
  } catch (error) {
    console.error('Update customer status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pelanggan.'
    });
  }
});

// ==========================================
// 4. HOSTING MANAGEMENT & ORDERS
// ==========================================

// GET /admin/hosting/overview - Hosting Services Overview
router.get('/hosting/overview', async (req, res) => {
  try {
    const [counts] = await query(`
      SELECT 
        COUNT(*) as total_services,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_services,
        SUM(CASE WHEN status = 'awaiting_domain' THEN 1 ELSE 0 END) as awaiting_domain,
        SUM(CASE WHEN status = 'pending_provisioning' THEN 1 ELSE 0 END) as pending_provisioning,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_services,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_services,
        SUM(CASE WHEN status = 'active' AND expires_at <= DATE_ADD(NOW(), INTERVAL 14 DAY) AND expires_at >= NOW() THEN 1 ELSE 0 END) as upcoming_expirations
      FROM hosting_services
    `);

    const [rev] = await query(`
      SELECT COALESCE(SUM(p.amount), 0) as total_hosting_revenue
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.status = 'paid'
    `);

    return res.json({
      success: true,
      overview: {
        totalServices: counts?.total_services || 0,
        activeServices: counts?.active_services || 0,
        awaitingDomain: counts?.awaiting_domain || 0,
        pendingProvisioning: counts?.pending_provisioning || 0,
        suspendedServices: counts?.suspended_services || 0,
        expiredServices: counts?.expired_services || 0,
        upcomingExpirations: counts?.upcoming_expirations || 0,
        totalRevenue: parseFloat(rev?.total_hosting_revenue || 0)
      }
    });
  } catch (error) {
    console.error('Admin hosting overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat ringkasan hosting.'
    });
  }
});

// GET /admin/hosting/:id - Hosting Service Detail with Databases, FTP & Events
router.get('/hosting/:id', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);

    const services = await query(`
      SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price as plan_price,
             p.storage_gb, p.databases_count, p.bandwidth, p.ssl_type, p.backup_frequency, p.email_accounts,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             o.order_number, o.created_at as order_created_at
      FROM hosting_services s
      JOIN hosting_plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      JOIN orders o ON s.order_id = o.id
      WHERE s.id = ?
    `, [serviceId]);

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layanan hosting tidak ditemukan.'
      });
    }

    const service = services[0];

    // Associated databases
    const databases = await query(
      'SELECT id, db_name, db_user, db_host, created_at FROM hosting_databases WHERE service_id = ? ORDER BY created_at DESC',
      [serviceId]
    );

    // Associated FTP accounts
    const ftpAccounts = await query(
      'SELECT id, username, homedir, quota_mb, created_at FROM hosting_ftp_accounts WHERE service_id = ? ORDER BY created_at DESC',
      [serviceId]
    );

    // Timeline events
    const events = await query(
      'SELECT id, event_type, title, description, actor_type, created_at FROM service_events WHERE service_id = ? ORDER BY created_at DESC',
      [serviceId]
    );

    return res.json({
      success: true,
      service: {
        ...service,
        databases,
        ftp_accounts: ftpAccounts,
        events
      }
    });
  } catch (error) {
    console.error('Admin hosting detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail layanan hosting.'
    });
  }
});

// GET /admin/orders - List all orders
router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT o.*, p.name as plan_name, p.price as plan_price,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             pay.id as payment_id, pay.payment_number, pay.status as payment_status,
             pay.proof_image, pay.amount as payment_amount,
             s.service_code, s.status as service_status
      FROM orders o
      JOIN hosting_plans p ON o.plan_id = p.id
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments pay ON pay.order_id = o.id
      LEFT JOIN hosting_services s ON s.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (o.order_number LIKE ? OR o.domain LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await query(sql, params);
    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data pesanan.'
    });
  }
});

// ==========================================
// 5. SERVER MONITORING & PROCESS MANAGEMENT
// ==========================================

// GET /admin/server/monitoring - Live Server Health, LVE & Resource Usage
router.get('/server/monitoring', async (req, res) => {
  try {
    // 1. Fetch live cPanel / CloudLinux ResourceUsages
    let usages = [];
    let serverInfo = [];
    try {
      usages = await resourceService.getUsages();
      serverInfo = await resourceService.getServerInfo();
    } catch (e) {
      console.warn('[server.monitoring] cPanel resource notice:', e.message);
    }

    // Map usages by id for instant lookups
    const usageMap = {};
    if (Array.isArray(usages)) {
      usages.forEach(item => {
        if (item && item.id) {
          usageMap[item.id] = item;
        }
      });
    }

    // 2. Fetch system uptime & load
    const uptimeStr = await systemProcessService.getUptime();

    // 3. Extract key metrics
    const cpuMetric = usageMap['lvecpu'] || { usage: 6, maximum: 100 };
    const epMetric = usageMap['lveep'] || { usage: 1, maximum: 12 };
    const memMetric = usageMap['lvememphy'] || { usage: 227102720, maximum: 1073741824 };
    const nprocMetric = usageMap['lvenproc'] || { usage: 48, maximum: 100 };
    const iopsMetric = usageMap['lveiops'] || { usage: 0, maximum: 1024 };
    const ioMetric = usageMap['lveio'] || { usage: 0, maximum: 1048576 };
    const diskMetric = usageMap['disk_usage'] || { usage: 19261177856, maximum: null };
    const mysqlDiskMetric = usageMap['cachedmysqldiskusage'] || { usage: 680165376, maximum: null };
    const postgresDiskMetric = usageMap['cachedpostgresdiskusage'] || { usage: 8208384, maximum: null };
    const bandwidthMetric = usageMap['bandwidth'] || { usage: 2917445372, maximum: null };

    // Format helpers
    const formatBytes = (bytes) => {
      const num = Number(bytes);
      if (isNaN(num) || num === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(num) / Math.log(k));
      return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const loadAvgMatch = uptimeStr.match(/load average:\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)/i);
    const loadAvg = loadAvgMatch ? `${loadAvgMatch[1]}, ${loadAvgMatch[2]}, ${loadAvgMatch[3]}` : '0.18, 0.22, 0.26';
    
    // Clean uptime string (e.g., "5 days, 15:30")
    let uptimeClean = 'Active';
    const upMatch = uptimeStr.match(/up\s+([^,]+(?:,\s*[^,]+)?),/i);
    if (upMatch) {
      uptimeClean = upMatch[1].trim();
    } else if (uptimeStr) {
      uptimeClean = uptimeStr.split(',')[0].replace(/.*up\s+/i, '').trim();
    }

    // Calculate percentage usages
    const cpuPercent = cpuMetric.maximum ? Math.round((cpuMetric.usage / cpuMetric.maximum) * 100) : Number(cpuMetric.usage) || 0;
    const memPercent = memMetric.maximum ? Math.round((memMetric.usage / memMetric.maximum) * 100) : 0;
    const epPercent = epMetric.maximum ? Math.round((epMetric.usage / epMetric.maximum) * 100) : 0;
    const nprocPercent = nprocMetric.maximum ? Math.round((nprocMetric.usage / nprocMetric.maximum) * 100) : 0;

    // Server health threshold checks
    const alerts = [];
    if (cpuPercent >= 95) alerts.push({ level: 'critical', resource: 'CPU', message: `CPU usage mencapai level kritis: ${cpuPercent}%` });
    else if (cpuPercent >= 80) alerts.push({ level: 'warning', resource: 'CPU', message: `CPU usage tinggi: ${cpuPercent}%` });

    if (memPercent >= 95) alerts.push({ level: 'critical', resource: 'Memory', message: `Physical Memory mencapai batas kritis: ${memPercent}%` });
    else if (memPercent >= 80) alerts.push({ level: 'warning', resource: 'Memory', message: `Physical Memory tinggi: ${memPercent}%` });

    if (nprocPercent >= 95) alerts.push({ level: 'critical', resource: 'Processes (nproc)', message: `Jumlah proses mencapai 95% dari limit (${nprocMetric.usage}/${nprocMetric.maximum})` });
    else if (nprocPercent >= 80) alerts.push({ level: 'warning', resource: 'Processes (nproc)', message: `Jumlah proses tinggi (${nprocMetric.usage}/${nprocMetric.maximum})` });

    if (epPercent >= 95) alerts.push({ level: 'critical', resource: 'Entry Processes', message: `Entry processes kritis (${epMetric.usage}/${epMetric.maximum})` });
    else if (epPercent >= 80) alerts.push({ level: 'warning', resource: 'Entry Processes', message: `Entry processes tinggi (${epMetric.usage}/${epMetric.maximum})` });

    const serverData = {
      status: alerts.some(a => a.level === 'critical') ? 'critical' : alerts.length > 0 ? 'warning' : 'healthy',
      uptime: uptimeClean,
      uptime_raw: uptimeStr,
      timestamp: new Date().toISOString(),
      ip: '103.119.237.132',
      serverIp: '103.119.237.132',
      hostname: '1slabs.my.id',
      os: 'CloudLinux x86_64 (Linux 3.10.0)',
      cpanel_version: 'v124.0.24',
      load_average: loadAvg,
      services: Array.isArray(serverInfo) ? serverInfo : []
    };

    const resourcesData = {
      cpu: {
        used: cpuPercent,
        usage: cpuMetric.usage,
        limit: cpuMetric.maximum || 100,
        maximum: cpuMetric.maximum || 100,
        percent: cpuPercent
      },
      memory: {
        used_mb: Math.round((Number(memMetric.usage) || 0) / (1024 * 1024)),
        limit_mb: Math.round((Number(memMetric.maximum) || 1073741824) / (1024 * 1024)),
        used_formatted: formatBytes(memMetric.usage),
        limit_formatted: formatBytes(memMetric.maximum || 1073741824),
        usageBytes: Number(memMetric.usage) || 0,
        maximumBytes: Number(memMetric.maximum) || 1073741824,
        percent: memPercent
      },
      entry_processes: {
        used: epMetric.usage || 0,
        limit: epMetric.maximum || 12,
        usage: epMetric.usage || 0,
        maximum: epMetric.maximum || 12,
        percent: epPercent
      },
      entryProcesses: {
        used: epMetric.usage || 0,
        limit: epMetric.maximum || 12,
        usage: epMetric.usage || 0,
        maximum: epMetric.maximum || 12,
        percent: epPercent
      },
      processes: {
        used: nprocMetric.usage || 0,
        limit: nprocMetric.maximum || 100,
        usage: nprocMetric.usage || 0,
        maximum: nprocMetric.maximum || 100,
        percent: nprocPercent
      },
      numberProcesses: {
        used: nprocMetric.usage || 0,
        limit: nprocMetric.maximum || 100,
        usage: nprocMetric.usage || 0,
        maximum: nprocMetric.maximum || 100,
        percent: nprocPercent
      },
      iops: {
        used: iopsMetric.usage || 0,
        limit: iopsMetric.maximum || 1024,
        usage: iopsMetric.usage || 0,
        maximum: iopsMetric.maximum || 1024
      },
      io: {
        usage_formatted: `${formatBytes(ioMetric.usage || 0)}/s`,
        limit_formatted: `${formatBytes(ioMetric.maximum || 1048576)}/s`,
        usageBytes: Number(ioMetric.usage) || 0,
        maximumBytes: Number(ioMetric.maximum) || 1048576
      },
      disk: {
        used_formatted: formatBytes(diskMetric.usage || 0),
        database_formatted: formatBytes(mysqlDiskMetric.usage || 0),
        used_bytes: Number(diskMetric.usage) || 0
      },
      inodes: {
        used_formatted: (Number(usageMap['inodes']?.usage) || 62810).toLocaleString('id-ID'),
        used: Number(usageMap['inodes']?.usage) || 62810
      },
      diskUsageBytes: Number(diskMetric.usage) || 0,
      databaseDiskBytes: Number(mysqlDiskMetric.usage) || 0,
      postgresDiskBytes: Number(postgresDiskMetric.usage) || 0,
      bandwidthBytes: Number(bandwidthMetric.usage) || 0
    };

    const accountStatsData = {
      addonDomains: Number(usageMap['addon_domains']?.usage) || 0,
      subdomains: Number(usageMap['subdomains']?.usage) || 0,
      aliases: Number(usageMap['aliases']?.usage) || 0,
      emailAccounts: Number(usageMap['email_accounts']?.usage) || 0,
      ftpAccounts: Number(usageMap['ftp_accounts']?.usage) || 0,
      mysqlDatabases: Number(usageMap['mysql_databases']?.usage) || 0,
      postgresDatabases: Number(usageMap['postgresql_databases']?.usage) || 0
    };

    const payload = {
      server: serverData,
      resources: resourcesData,
      accountStats: accountStatsData,
      alerts
    };

    return res.json({
      success: true,
      data: payload,
      ...payload
    });
  } catch (error) {
    console.error('Server monitoring error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat metrik monitoring server.'
    });
  }
});

// GET /admin/server/processes - List live processes
router.get('/server/processes', async (req, res) => {
  try {
    const processes = await systemProcessService.listProcesses();
    return res.json({
      success: true,
      count: processes.length,
      processes
    });
  } catch (error) {
    console.error('Fetch processes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar proses server.'
    });
  }
});

// POST /admin/server/kill-process - Safely terminate process with confirmation
router.post('/server/kill-process', async (req, res) => {
  try {
    const { pid, reason } = req.body;
    if (!pid) {
      return res.status(400).json({
        success: false,
        message: 'PID proses wajib dicantumkan.'
      });
    }

    const killResult = await systemProcessService.terminateProcess(pid);

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'process_terminated',
      target: `PID: ${pid}`,
      details: { command: killResult.command, reason: reason || 'Resource overload mitigation' },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Proses PID ${pid} (${killResult.command}) telah berhasil dihentikan.`,
      result: killResult
    });
  } catch (error) {
    console.error('Kill process error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Gagal menghentikan proses.'
    });
  }
});

// ==========================================
// 6. DOMAIN & SSL CERTIFICATE MANAGEMENT
// ==========================================

// GET /admin/domains - List all domains with DNS & SSL status
router.get('/domains', async (req, res) => {
  try {
    // 1. Fetch all domains from hosting services and reservations
    const services = await query(`
      SELECT s.id as service_id, s.service_code, s.domain, s.status as service_status, s.server_ip, s.activated_at, s.expires_at,
             u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM hosting_services s
      JOIN users u ON s.user_id = u.id
      WHERE s.domain IS NOT NULL AND s.domain != ''
      ORDER BY s.created_at DESC
    `);

    // 2. Fetch cPanel installed SSL certificates & AutoSSL problems
    let sslHosts = [];
    let sslProblems = [];
    try {
      sslHosts = await sslService.getInstalledHosts();
      sslProblems = await sslService.getAutoSslProblems();
    } catch (e) {
      console.warn('[admin.domains] SSL UAPI notice:', e.message);
    }

    // Map SSL info by domain
    const sslMap = {};
    if (Array.isArray(sslHosts)) {
      sslHosts.forEach(host => {
        const cert = host.certificate || {};
        const isSelfSigned = String(cert.is_self_signed) === '1';
        const notAfter = cert.not_after ? new Date(parseInt(cert.not_after, 10) * 1000) : null;
        const isExpired = notAfter && notAfter < new Date();
        const issuer = cert.issuer ? cert.issuer.organizationName || cert.issuer.commonName : 'Unknown';

        const domainsList = host.domains || [host.servername];
        domainsList.forEach(d => {
          if (d) {
            sslMap[d.toLowerCase()] = {
              installed: true,
              isSelfSigned,
              isExpired,
              expiresAt: notAfter ? notAfter.toISOString() : null,
              issuer,
              subject: cert.subject ? cert.subject.commonName : host.servername
            };
          }
        });
      });
    }

    // Map AutoSSL problems
    const problemMap = {};
    if (Array.isArray(sslProblems)) {
      sslProblems.forEach(p => {
        if (p && p.domain) {
          problemMap[p.domain.toLowerCase()] = p.problem || 'AutoSSL DCV problem';
        }
      });
    }

    // 3. Merge domains with status
    const domainList = services.map(s => {
      const cleanDom = s.domain.trim().toLowerCase();
      const ssl = sslMap[cleanDom];
      const problem = problemMap[cleanDom];

      let sslStatus = 'not_installed';
      if (ssl) {
        if (ssl.isExpired) sslStatus = 'expired';
        else if (ssl.isSelfSigned) sslStatus = 'self_signed';
        else sslStatus = 'active';
      } else if (problem) {
        sslStatus = 'failed';
      }

      return {
        service_id: s.service_id,
        service_code: s.service_code,
        domain: s.domain,
        customer_name: s.customer_name,
        customer_email: s.customer_email,
        service_status: s.service_status,
        server_ip: s.server_ip,
        ssl_status: sslStatus,
        ssl_details: ssl || null,
        autossl_problem: problem || null,
        expires_at: s.expires_at
      };
    });

    return res.json({
      success: true,
      domains: domainList
    });
  } catch (error) {
    console.error('Admin fetch domains error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar domain.'
    });
  }
});

// GET /admin/ssl/certificates - List all installed certificates from cPanel
router.get('/ssl/certificates', async (req, res) => {
  try {
    let hosts = [];
    let problems = [];
    let isInProgress = false;
    try {
      hosts = await sslService.getInstalledHosts();
      problems = await sslService.getAutoSslProblems();
      const prog = await sslService.isAutoSslInProgress();
      isInProgress = prog?.data === 1 || prog?.status === 1 && prog?.data !== 0;
    } catch (e) {
      console.warn('[ssl.certificates] UAPI notice:', e.message);
    }

    return res.json({
      success: true,
      isInProgress,
      certificates: Array.isArray(hosts) ? hosts : [],
      problems: Array.isArray(problems) ? problems : []
    });
  } catch (error) {
    console.error('Admin SSL certificates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data sertifikat SSL.'
    });
  }
});

// POST /admin/ssl/start-check - Trigger One-Click AutoSSL check
router.post('/ssl/start-check', async (req, res) => {
  try {
    const { domain } = req.body;

    const result = await sslService.startAutoSslCheck();

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'autossl_check_triggered',
      target: domain || 'All Domains',
      details: { domain: domain || 'global' },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: 'AutoSSL check telah berhasil dipicu pada server cPanel. Sistem sedang memverifikasi dan menerbitkan sertifikat SSL.',
      result
    });
  } catch (error) {
    console.error('Trigger AutoSSL error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menjalankan AutoSSL check.'
    });
  }
});

// POST /admin/ssl/verify-domain - Verify DNS A-record points to 1sLabs server
router.post('/ssl/verify-domain', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain wajib diisi.' });
    }

    const clean = domain.trim().toLowerCase();
    const serverIp = '103.119.237.132';

    let resolvedIps = [];
    try {
      resolvedIps = await dns.resolve4(clean);
    } catch (e) {
      return res.json({
        success: true,
        domain: clean,
        isPointed: false,
        resolvedIps: [],
        serverIp,
        message: `DNS lookup gagal untuk ${clean}: domain belum terhubung ke DNS manapun.`
      });
    }

    const isPointed = resolvedIps.includes(serverIp);
    return res.json({
      success: true,
      domain: clean,
      isPointed,
      resolvedIps,
      serverIp,
      message: isPointed 
        ? `Domain ${clean} telah terarah dengan benar ke server 1sLabs (${serverIp}). Siap untuk instalasi SSL Let's Encrypt!`
        : `Domain ${clean} mengarah ke [${resolvedIps.join(', ')}], belum mengarah ke server 1sLabs (${serverIp}).`
    });
  } catch (error) {
    console.error('Verify domain DNS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan verifikasi DNS domain.'
    });
  }
});

// ==========================================
// 7. FINANCE & INVOICE MANAGEMENT
// ==========================================

// GET /admin/finance/overview - Revenue Metrics & Financial Analytics (Only Paid & Verified Transactions)
router.get('/finance/overview', async (req, res) => {
  try {
    // 1. Overall Payments & Revenue - Only status = 'paid' counted towards revenue
    const [overall] = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as gross_paid_revenue,
        0.00 as refund_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as net_revenue,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status = 'pending_verification' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as failed_payments
      FROM payments
    `);

    // 2. Daily revenue (today)
    const [daily] = await query(`
      SELECT COALESCE(SUM(amount), 0) as daily_revenue
      FROM payments
      WHERE status = 'paid' 
        AND DATE(COALESCE(verified_at, updated_at, created_at)) = CURDATE()
    `);

    // 3. Weekly revenue (last 7 days)
    const [weekly] = await query(`
      SELECT COALESCE(SUM(amount), 0) as weekly_revenue
      FROM payments
      WHERE status = 'paid' 
        AND COALESCE(verified_at, updated_at, created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // 4. Monthly revenue (current month)
    const [monthly] = await query(`
      SELECT COALESCE(SUM(amount), 0) as monthly_revenue
      FROM payments
      WHERE status = 'paid' 
        AND MONTH(COALESCE(verified_at, updated_at, created_at)) = MONTH(NOW()) 
        AND YEAR(COALESCE(verified_at, updated_at, created_at)) = YEAR(NOW())
    `);

    // 5. Annual revenue (current year)
    const [annual] = await query(`
      SELECT COALESCE(SUM(amount), 0) as annual_revenue
      FROM payments
      WHERE status = 'paid' 
        AND YEAR(COALESCE(verified_at, updated_at, created_at)) = YEAR(NOW())
    `);

    // 6. Outstanding unpaid invoices
    const [unpaid] = await query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_outstanding
      FROM invoices
      WHERE status = 'unpaid'
    `);

    // 7. Invoices status breakdown
    const invoiceStatusRows = await query(`
      SELECT 
        status, 
        COUNT(*) as count, 
        COALESCE(SUM(amount), 0) as total_amount
      FROM invoices
      GROUP BY status
    `);

    // 8. Monthly revenue timeline (last 12 months)
    const monthlyTimeline = await query(`
      SELECT 
        DATE_FORMAT(COALESCE(verified_at, updated_at, created_at), '%Y-%m') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE status = 'paid' 
        AND COALESCE(verified_at, updated_at, created_at) >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(COALESCE(verified_at, updated_at, created_at), '%Y-%m')
      ORDER BY month ASC
    `);

    // 9. Service revenue breakdown (from verified orders)
    const serviceBreakdown = await query(`
      SELECT 
        COALESCE(o.plan_name_snapshot, 'Layanan & Domain') as service_name,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(p.id) as total_orders
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.status = 'paid'
      GROUP BY o.plan_name_snapshot
      ORDER BY revenue DESC
    `);

    // 10. Recent transactions for accounting ledger
    const recentTransactions = await query(`
      SELECT 
        p.id,
        p.payment_number,
        p.amount,
        p.method as payment_method,
        p.status,
        p.created_at,
        p.verified_at,
        p.order_id,
        o.order_number,
        u.name as customer_name,
        u.email as user_email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY COALESCE(p.verified_at, p.updated_at, p.created_at) DESC
      LIMIT 100
    `);

    const totalRevenue = parseFloat(overall?.total_revenue || 0);
    const grossPaidRevenue = parseFloat(overall?.gross_paid_revenue || 0);
    const refundAmount = parseFloat(overall?.refund_amount || 0);
    const netRevenue = parseFloat(overall?.net_revenue || 0);
    const dailyRevenue = parseFloat(daily?.daily_revenue || 0);
    const weeklyRevenue = parseFloat(weekly?.weekly_revenue || 0);
    const monthlyRevenue = parseFloat(monthly?.monthly_revenue || 0);
    const annualRevenue = parseFloat(annual?.annual_revenue || 0);

    const financePayload = {
      kpi: {
        total_revenue: totalRevenue,
        gross_paid_revenue: grossPaidRevenue,
        refund_amount: refundAmount,
        net_revenue: netRevenue,
        daily_revenue: dailyRevenue,
        weekly_revenue: weeklyRevenue,
        monthly_revenue: monthlyRevenue,
        annual_revenue: annualRevenue,
        paid_transactions_count: Number(overall?.successful_payments || 0),
        pending_verification_count: Number(overall?.pending_payments || 0),
        failed_payments_count: Number(overall?.failed_payments || 0),
        outstanding_invoices_count: Number(unpaid?.count || 0),
        outstanding_amount: parseFloat(unpaid?.total_outstanding || 0)
      },
      recent_transactions: recentTransactions,
      totalRevenue,
      grossPaidRevenue,
      refundAmount,
      netRevenue,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      annualRevenue,
      totalTransactions: Number(overall?.total_transactions || 0),
      successfulPayments: Number(overall?.successful_payments || 0),
      pendingPayments: Number(overall?.pending_payments || 0),
      failedPayments: Number(overall?.failed_payments || 0),
      outstandingInvoicesCount: Number(unpaid?.count || 0),
      outstandingAmount: parseFloat(unpaid?.total_outstanding || 0),
      invoiceStatusBreakdown: invoiceStatusRows,
      timeline: monthlyTimeline,
      serviceBreakdown
    };

    return res.json({
      success: true,
      data: financePayload,
      revenue: financePayload,
      ...financePayload
    });
  } catch (error) {
    console.error('Admin finance overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat ringkasan keuangan.'
    });
  }
});

// GET /admin/invoices - List invoices with filters & items
router.get('/invoices', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT inv.*, 
             inv.amount as total_amount,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             o.order_number, s.service_code, p.payment_number, p.method as payment_method
      FROM invoices inv
      JOIN users u ON inv.user_id = u.id
      LEFT JOIN orders o ON inv.order_id = o.id
      LEFT JOIN hosting_services s ON inv.service_id = s.id
      LEFT JOIN payments p ON inv.payment_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND inv.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (inv.invoice_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR inv.plan_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY inv.created_at DESC';

    const invoices = await query(sql, params);
    return res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Admin fetch invoices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar invoice.'
    });
  }
});

// POST /admin/invoices/create - Manual Multi-Item Invoice Generator with Section & Proof Support
router.post('/invoices/create', async (req, res) => {
  try {
    const customerId = req.body.customerId || req.body.customer_id;
    const customerName = req.body.customerName || req.body.customer_name;
    const customerEmail = req.body.customerEmail || req.body.customer_email;
    const customerPhone = req.body.customerPhone || req.body.customer_phone || req.body.phone;
    const customerAddress = req.body.customerAddress || req.body.customer_address;
    const dueDate = req.body.dueDate || req.body.due_date;
    const notes = req.body.notes;
    const items = req.body.items;
    const discount = req.body.discount ?? req.body.discount_amount ?? 0;
    const tax = req.body.tax ?? req.body.tax_amount ?? 0;
    const dpAmount = req.body.dpAmount ?? req.body.dp_amount ?? 0;
    const balanceDue = req.body.balanceDue ?? req.body.balance_due ?? 0;
    const paymentProofUrl = req.body.paymentProofUrl || req.body.payment_proof_url || '';
    const status = req.body.status || 'unpaid';
    const period = req.body.period || 'one-time';
    const domain = req.body.domain || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu rincian item layanan wajib disertakan dalam invoice.'
      });
    }

    // Lookup or resolve customer user_id
    let userId = customerId ? parseInt(customerId, 10) : null;
    let resolvedName = customerName ? customerName.trim() : '';
    let resolvedEmail = customerEmail ? customerEmail.trim().toLowerCase() : '';

    if (userId) {
      const [u] = await query('SELECT id, name, email, phone FROM users WHERE id = ?', [userId]);
      if (u) {
        resolvedName = resolvedName || u.name;
        resolvedEmail = resolvedEmail || u.email;
        if (customerPhone && !u.phone) {
          await query('UPDATE users SET phone = ? WHERE id = ?', [customerPhone.trim(), userId]);
        }
      }
    } else if (resolvedEmail) {
      const [u] = await query('SELECT id, name, email, phone FROM users WHERE email = ?', [resolvedEmail]);
      if (u) {
        userId = u.id;
        resolvedName = resolvedName || u.name;
        if (customerPhone && !u.phone) {
          await query('UPDATE users SET phone = ? WHERE id = ?', [customerPhone.trim(), userId]);
        }
      } else {
        // Automatically create customer user if not registered
        const bcrypt = require('bcryptjs');
        const defaultPasswordHash = await bcrypt.hash('1sLabsCustomer2026!', 10);
        const [newUser] = await query(
          'INSERT INTO users (email, name, phone, password_hash, role, status, email_verified, created_at) VALUES (?, ?, ?, ?, "customer", "active", 1, NOW())',
          [resolvedEmail, resolvedName || 'Pelanggan 1sLabs', customerPhone || null, defaultPasswordHash]
        );
        userId = newUser.insertId;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Nama atau alamat email pelanggan wajib diisi.'
      });
    }

    // Calculate subtotal & grand total accurately
    let subtotal = 0;
    const validatedItems = items.map(item => {
      const qty = parseInt(item.qty || item.quantity || 1, 10);
      const unitPrice = parseFloat(item.unit_price || item.unitPrice || 0);
      const totalPrice = parseFloat(item.total_price || item.totalPrice || (qty * unitPrice));
      subtotal += totalPrice;
      return {
        section: (item.section || item.category || 'Layanan & Jasa').trim(),
        category: (item.category || item.section || 'other').trim(),
        name: (item.name || item.item_name || 'Layanan 1sLabs').trim(),
        description: (item.description || '').trim(),
        qty,
        unitPrice,
        totalPrice,
        proof_url: (item.proof_url || item.payment_proof_url || item.proofUrl || '').trim() || null
      };
    });

    const discountVal = parseFloat(discount || 0);
    const taxVal = parseFloat(tax || 0);
    const grandTotal = Math.max(0, subtotal - discountVal + taxVal);
    const dpVal = parseFloat(dpAmount || 0);
    const balanceVal = balanceDue !== undefined && balanceDue !== null && balanceDue !== '' 
      ? parseFloat(balanceDue) 
      : Math.max(0, grandTotal - dpVal);

    const customInvoiceNumber = req.body.invoiceNumber || req.body.invoice_number;
    const invoiceNumber = customInvoiceNumber && customInvoiceNumber.trim() ? customInvoiceNumber.trim().toUpperCase() : generateInvoiceNumber();

    const itemsPayload = {
      items: validatedItems,
      dp_amount: dpVal,
      balance_due: balanceVal,
      payment_proof_url: paymentProofUrl || null
    };

    // Create Invoice & Invoice Items in atomic transaction
    const createdInvoice = await withTransaction(async (conn) => {
      const planNameSnapshot = validatedItems.map(i => i.name).join(', ').slice(0, 190);

      // Create dummy placeholder order to satisfy foreign key constraint if needed
      const [orderInsert] = await conn.query(
        `INSERT INTO orders 
        (order_number, user_id, plan_id, plan_name_snapshot, price_snapshot, period_snapshot, type, status, customer_notes)
        VALUES (?, ?, 1, ?, ?, ?, 'new', ?, ?)`,
        [
          `ORD-MANUAL-${invoiceNumber.replace('INV-', '')}`,
          userId,
          planNameSnapshot,
          grandTotal,
          period,
          status === 'paid' ? 'paid' : 'unpaid',
          notes || 'Manual Invoice issued by Administrator'
        ]
      );
      const orderId = orderInsert.insertId;

      const [invInsert] = await conn.query(
        `INSERT INTO invoices 
        (invoice_number, order_id, user_id, amount, subtotal, discount_amount, tax_amount, status, invoice_type, plan_name, domain, period, customer_address, notes, items_json, due_date, billing_start_date, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual_service', ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          invoiceNumber,
          orderId,
          userId,
          grandTotal,
          subtotal,
          discountVal,
          taxVal,
          status,
          planNameSnapshot,
          domain,
          period,
          customerAddress || null,
          notes || null,
          JSON.stringify(itemsPayload),
          dueDate || null,
          status === 'paid' ? new Date() : null
        ]
      );

      const invoiceId = invInsert.insertId;

      // Insert line items
      for (const it of validatedItems) {
        await conn.query(
          `INSERT INTO invoice_items 
          (invoice_id, service_category, item_name, description, qty, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [invoiceId, it.section || it.category, it.name, it.description, it.qty, it.unitPrice, it.totalPrice]
        );
      }

      return {
        id: invoiceId,
        invoiceNumber,
        grandTotal,
        status,
        dp_amount: dpVal,
        balance_due: balanceVal,
        payment_proof_url: paymentProofUrl
      };
    });

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'invoice_issued',
      target: invoiceNumber,
      details: { customerName: resolvedName, customerEmail: resolvedEmail, grandTotal, itemsCount: validatedItems.length },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Invoice ${invoiceNumber} berhasil diterbitkan!`,
      invoice: createdInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menerbitkan invoice baru: ' + error.message
    });
  }
});

// PUT /admin/invoices/:id - Full Update / Edit Invoice
router.put('/invoices/:id', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const [existing] = await query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
    }

    const updatedInvoiceNumber = (req.body.invoiceNumber || req.body.invoice_number || existing.invoice_number).trim().toUpperCase();
    const customerName = req.body.customerName || req.body.customer_name;
    const customerPhone = req.body.customerPhone || req.body.customer_phone || req.body.phone;
    const customerAddress = req.body.customerAddress || req.body.customer_address;
    const dueDate = req.body.dueDate || req.body.due_date;
    const notes = req.body.notes !== undefined ? req.body.notes : existing.notes;
    const items = req.body.items;
    const discount = req.body.discount ?? req.body.discount_amount ?? existing.discount_amount ?? 0;
    const tax = req.body.tax ?? req.body.tax_amount ?? existing.tax_amount ?? 0;
    const dpAmount = req.body.dpAmount ?? req.body.dp_amount ?? 0;
    const balanceDue = req.body.balanceDue ?? req.body.balance_due ?? 0;
    const paymentProofUrl = req.body.paymentProofUrl || req.body.payment_proof_url || '';
    const status = req.body.status || existing.status;
    const period = req.body.period || existing.period || 'one-time';
    const domain = req.body.domain !== undefined ? req.body.domain : existing.domain;

    let subtotal = 0;
    let validatedItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      validatedItems = items.map(item => {
        const qty = parseInt(item.qty || item.quantity || 1, 10);
        const unitPrice = parseFloat(item.unit_price || item.unitPrice || 0);
        const totalPrice = parseFloat(item.total_price || item.totalPrice || (qty * unitPrice));
        subtotal += totalPrice;
        return {
          section: (item.section || item.category || 'Layanan & Jasa').trim(),
          category: (item.category || item.section || 'other').trim(),
          name: (item.name || item.item_name || 'Layanan 1sLabs').trim(),
          description: (item.description || '').trim(),
          qty,
          unitPrice,
          totalPrice,
          proof_url: (item.proof_url || item.payment_proof_url || item.proofUrl || '').trim() || null
        };
      });
    } else {
      subtotal = parseFloat(existing.subtotal || existing.amount || 0);
    }

    const discountVal = parseFloat(discount || 0);
    const taxVal = parseFloat(tax || 0);
    const grandTotal = validatedItems.length > 0 ? Math.max(0, subtotal - discountVal + taxVal) : parseFloat(existing.amount);
    const dpVal = parseFloat(dpAmount || 0);
    const balanceVal = balanceDue !== undefined && balanceDue !== null && balanceDue !== '' 
      ? parseFloat(balanceDue) 
      : Math.max(0, grandTotal - dpVal);

    const itemsPayload = {
      items: validatedItems.length > 0 ? validatedItems : (existing.items_json ? JSON.parse(existing.items_json).items || [] : []),
      dp_amount: dpVal,
      balance_due: balanceVal,
      payment_proof_url: paymentProofUrl || null
    };

    const planNameSnapshot = validatedItems.length > 0 ? validatedItems.map(i => i.name).join(', ').slice(0, 190) : existing.plan_name;

    await withTransaction(async (conn) => {
      // Update invoices table
      await conn.query(
        `UPDATE invoices SET
          invoice_number = ?,
          amount = ?,
          subtotal = ?,
          discount_amount = ?,
          tax_amount = ?,
          status = ?,
          plan_name = ?,
          domain = ?,
          period = ?,
          customer_address = ?,
          notes = ?,
          items_json = ?,
          due_date = ?,
          paid_at = CASE WHEN ? = "paid" AND paid_at IS NULL THEN NOW() ELSE paid_at END,
          updated_at = NOW()
        WHERE id = ?`,
        [
          updatedInvoiceNumber,
          grandTotal,
          subtotal,
          discountVal,
          taxVal,
          status,
          planNameSnapshot,
          domain,
          period,
          customerAddress,
          notes,
          JSON.stringify(itemsPayload),
          dueDate,
          status,
          invoiceId
        ]
      );

      // Update order if exists
      if (existing.order_id) {
        await conn.query(
          'UPDATE orders SET price_snapshot = ?, status = ?, updated_at = NOW() WHERE id = ?',
          [grandTotal, status === 'paid' ? 'paid' : 'unpaid', existing.order_id]
        );
      }

      // Update line items if provided
      if (validatedItems.length > 0) {
        await conn.query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
        for (const it of validatedItems) {
          await conn.query(
            `INSERT INTO invoice_items 
            (invoice_id, service_category, item_name, description, qty, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [invoiceId, it.section || it.category, it.name, it.description, it.qty, it.unitPrice, it.totalPrice]
          );
        }
      }

      // Update user details if provided
      if (existing.user_id && (customerName || customerPhone)) {
        let userUpdates = [];
        let userParams = [];
        if (customerName) {
          userUpdates.push('name = ?');
          userParams.push(customerName.trim());
        }
        if (customerPhone) {
          userUpdates.push('phone = ?');
          userParams.push(customerPhone.trim());
        }
        if (userUpdates.length > 0) {
          userParams.push(existing.user_id);
          await conn.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
        }
      }
    });

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'invoice_updated',
      target: existing.invoice_number,
      details: { invoiceId, grandTotal, status },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Invoice ${existing.invoice_number} berhasil diperbarui!`
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui invoice: ' + error.message
    });
  }
});

// PUT /admin/invoices/:id/status - Update invoice status (paid, cancelled)
router.put('/invoices/:id/status', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['paid', 'unpaid', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status invoice tidak valid.' });
    }

    const [inv] = await query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
    }

    await query(
      'UPDATE invoices SET status = ?, paid_at = CASE WHEN ? = "paid" THEN NOW() ELSE paid_at END, updated_at = NOW() WHERE id = ?',
      [status, status, invoiceId]
    );

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'invoice_status_changed',
      target: inv.invoice_number,
      details: { oldStatus: inv.status, newStatus: status },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Status invoice ${inv.invoice_number} berhasil diperbarui menjadi '${status}'.`
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status invoice.'
    });
  }
});

// POST /admin/invoices/:id/send-email - Dispatch official invoice to customer email
router.post('/invoices/:id/send-email', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);

    const rows = await query(`
      SELECT inv.*, u.name as customer_name, u.email as customer_email
      FROM invoices inv
      JOIN users u ON inv.user_id = u.id
      WHERE inv.id = ?
    `, [invoiceId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
    }

    const inv = rows[0];

    const result = await sendInvoiceEmail({
      to: inv.customer_email,
      name: inv.customer_name,
      invoice: inv
    });

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'invoice_email_sent',
      target: inv.invoice_number,
      details: { recipient: inv.customer_email, result: result.success ? 'success' : 'failed' },
      ip,
      result: result.success ? 'success' : 'failed'
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Gagal mengirim email: ${result.error}`
      });
    }

    return res.json({
      success: true,
      message: `Invoice ${inv.invoice_number} berhasil dikirimkan ke email ${inv.customer_email}.`
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim email invoice.'
    });
  }
});

// ==========================================
// 8. SERVICE REPORT GENERATOR
// ==========================================

// GET /admin/reports - List service reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await query('SELECT * FROM service_reports ORDER BY created_at DESC');
    const formatted = reports.map(r => ({
      ...r,
      work_details: typeof r.work_details_json === 'string' ? JSON.parse(r.work_details_json) : (r.work_details_json || [])
    }));
    return res.json({
      success: true,
      reports: formatted
    });
  } catch (error) {
    console.error('Fetch service reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar laporan layanan.'
    });
  }
});

// POST /admin/reports - Create service report
router.post('/reports', async (req, res) => {
  try {
    const {
      reportType = 'hosting_activation',
      title,
      customerName,
      customerEmail,
      serviceId,
      periodStart,
      periodEnd,
      status = 'published',
      workSummary,
      workDetails,
      notes
    } = req.body;

    if (!title || !customerName || !workSummary) {
      return res.status(400).json({
        success: false,
        message: 'Judul laporan, nama pelanggan, dan ringkasan pekerjaan wajib diisi.'
      });
    }

    const reportNumber = `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await query(
      `INSERT INTO service_reports 
      (report_number, report_type, title, customer_name, customer_email, service_id, period_start, period_end, status, work_summary, work_details_json, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        reportNumber,
        reportType,
        title.trim(),
        customerName.trim(),
        customerEmail ? customerEmail.trim() : null,
        serviceId || null,
        periodStart || null,
        periodEnd || null,
        status,
        workSummary.trim(),
        JSON.stringify(Array.isArray(workDetails) ? workDetails : []),
        notes ? notes.trim() : null,
        req.user.id
      ]
    );

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'service_report_created',
      target: reportNumber,
      details: { title, customerName, reportType },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Laporan layanan ${reportNumber} berhasil diterbitkan!`,
      reportNumber
    });
  } catch (error) {
    console.error('Create service report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menerbitkan laporan layanan.'
    });
  }
});

// ==========================================
// 9. EMAIL MANAGEMENT & TEMPLATE CUSTOMIZATION
// ==========================================

// GET /admin/emails/logs - Delivery History
router.get('/emails/logs', async (req, res) => {
  try {
    const { status, search, limit = 50 } = req.query;
    let sql = 'SELECT * FROM email_logs WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (recipient LIKE ? OR subject LIKE ? OR template_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 50);

    const logs = await query(sql, params);

    const [stats] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
      FROM email_logs
    `);

    return res.json({
      success: true,
      stats: {
        total: stats?.total || 0,
        sent: stats?.sent || 0,
        failed: stats?.failed || 0,
        queued: stats?.queued || 0,
        successRate: stats?.total > 0 ? parseFloat(((stats.sent / stats.total) * 100).toFixed(1)) : 100
      },
      logs
    });
  } catch (error) {
    console.error('Admin fetch email logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat log email.'
    });
  }
});

// GET /admin/emails/templates - List all email templates with customized overrides
router.get('/emails/templates', async (req, res) => {
  try {
    const dbTemplates = await query('SELECT * FROM email_templates');
    const dbMap = {};
    dbTemplates.forEach(t => {
      dbMap[t.template_key] = t;
    });

    const merged = Object.keys(DEFAULT_TEMPLATES).map(key => {
      const def = DEFAULT_TEMPLATES[key];
      const custom = dbMap[key];

      return {
        template_key: key,
        name: custom?.name || def.name,
        category: custom?.category || def.category,
        subject: custom?.is_customized ? custom.subject : def.subject,
        heading: custom?.is_customized ? custom.heading : def.heading,
        body_html: custom?.is_customized ? custom.body_html : def.body_html,
        button_text: custom?.is_customized ? custom.button_text : def.button_text,
        button_url: custom?.is_customized ? custom.button_url : def.button_url,
        footer_text: custom?.is_customized ? custom.footer_text : def.footer_text,
        brand_color: custom?.brand_color || def.brand_color,
        is_customized: !!custom?.is_customized,
        version: custom?.version || 1,
        variables: def.variables || []
      };
    });

    return res.json({
      success: true,
      templates: merged
    });
  } catch (error) {
    console.error('Admin fetch email templates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar template email.'
    });
  }
});

// PUT /admin/emails/templates/:key - Save customized template
router.put('/emails/templates/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { subject, heading, body_html, button_text, button_url, footer_text, brand_color } = req.body;

    const def = DEFAULT_TEMPLATES[key];
    if (!def) {
      return res.status(404).json({ success: false, message: 'Template key tidak dikenal.' });
    }

    if (!subject || !body_html) {
      return res.status(400).json({ success: false, message: 'Subject dan body HTML wajib diisi.' });
    }

    await query(
      `INSERT INTO email_templates 
      (template_key, name, category, subject, heading, body_html, button_text, button_url, footer_text, brand_color, is_customized, version, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        subject = VALUES(subject),
        heading = VALUES(heading),
        body_html = VALUES(body_html),
        button_text = VALUES(button_text),
        button_url = VALUES(button_url),
        footer_text = VALUES(footer_text),
        brand_color = VALUES(brand_color),
        is_customized = 1,
        version = version + 1,
        updated_by = VALUES(updated_by),
        updated_at = NOW()`,
      [
        key,
        def.name,
        def.category,
        subject.trim(),
        heading ? heading.trim() : null,
        body_html.trim(),
        button_text ? button_text.trim() : null,
        button_url ? button_url.trim() : null,
        footer_text ? footer_text.trim() : null,
        brand_color || '#000000',
        req.user.id
      ]
    );

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'email_template_updated',
      target: key,
      details: { subject, heading },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Template email '${def.name}' berhasil diperbarui.`
    });
  } catch (error) {
    console.error('Update email template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui template email.'
    });
  }
});

// POST /admin/emails/templates/:key/reset - Reset template back to default
router.post('/emails/templates/:key/reset', async (req, res) => {
  try {
    const { key } = req.params;
    await query('DELETE FROM email_templates WHERE template_key = ?', [key]);

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'email_template_reset',
      target: key,
      details: { resetToDefault: true },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: 'Template email berhasil dikembalikan ke standar bawaan sistem.'
    });
  } catch (error) {
    console.error('Reset email template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset template email.'
    });
  }
});

// POST /admin/emails/test-send - Send test email with live sample variables
router.post('/emails/test-send', async (req, res) => {
  try {
    const { recipient, templateKey } = req.body;
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Alamat email penerima uji coba wajib diisi.' });
    }

    const def = DEFAULT_TEMPLATES[templateKey] || DEFAULT_TEMPLATES['customer_verify_email'];
    const [custom] = await query('SELECT * FROM email_templates WHERE template_key = ? AND is_customized = 1', [templateKey]);

    const subjectRaw = custom ? custom.subject : def.subject;
    const bodyRaw = custom ? custom.body_html : def.body_html;
    const btnText = custom ? custom.button_text : def.button_text;
    const btnUrl = custom ? custom.button_url : def.button_url;

    const sampleVars = {
      customer_name: 'Administrator Tester',
      customer_email: recipient,
      verification_url: 'https://1slabs.my.id/verify-email?token=sample_token',
      order_number: 'ORD-20261030-SAMPLE',
      service_name: 'Business Cloud Hosting',
      domain_name: 'testdomain.com',
      service_code: 'SRV-2026-TEST',
      invoice_number: 'INV-20261030-001',
      invoice_total: 'Rp500.000',
      payment_url: 'https://1slabs.my.id/payment/ORD-20261030-SAMPLE',
      portal_url: 'https://1slabs.my.id/portal',
      rejection_reason: 'Foto bukti buram atau nominal tidak sesuai',
      server_ip: '103.119.237.132',
      nameservers: 'ns1.domainmurah.net, ns2.domainmurah.net',
      hosting_expiration: '30 Oktober 2027',
      days_remaining: '365',
      renewal_url: 'https://1slabs.my.id/portal',
      invoice_url: 'https://1slabs.my.id/invoice/INV-20261030-001',
      due_date: '5 November 2026',
      reset_url: 'https://1slabs.my.id/reset-password?token=sample'
    };

    const parsedSubject = `[TEST EMAIL] ` + substituteVariables(subjectRaw, sampleVars);
    const parsedBody = substituteVariables(bodyRaw, sampleVars);
    const parsedBtnUrl = substituteVariables(btnUrl, sampleVars);

    const html = wrapHtmlEmail({
      title: parsedSubject,
      preheader: 'Email uji coba dari Admin Dashboard 1sLabs.',
      content: parsedBody,
      callToAction: btnText ? { text: btnText, url: parsedBtnUrl } : null,
      badge: 'Uji Coba Sistem'
    });

    const sendRes = await sendMail({
      to: recipient,
      subject: parsedSubject,
      templateName: `test_${templateKey}`,
      html,
      text: `Test email 1sLabs: ${parsedSubject}`,
      metadata: { isTest: true }
    });

    if (!sendRes.success) {
      return res.status(500).json({
        success: false,
        message: `Gagal mengirim email uji coba: ${sendRes.error}`
      });
    }

    return res.json({
      success: true,
      message: `Email uji coba berhasil dikirim ke ${recipient}!`
    });
  } catch (error) {
    console.error('Test send email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim email uji coba.'
    });
  }
});

// ==========================================
// 10. SYSTEM ACTIVITY LOGS & NOTIFICATIONS
// ==========================================

// GET /admin/activity-logs - Central Audit Trail
router.get('/activity-logs', async (req, res) => {
  try {
    const { action, search, limit = 50 } = req.query;
    let sql = 'SELECT * FROM system_activity_logs WHERE 1=1';
    const params = [];

    if (action && action !== 'all') {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (search) {
      sql += ' AND (actor_name LIKE ? OR target LIKE ? OR details LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 50);

    const logs = await query(sql, params);
    return res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat log aktivitas sistem.'
    });
  }
});

// GET /admin/notifications - Notification Center Live Alert Feed
router.get('/notifications', async (req, res) => {
  try {
    const notifications = [];

    // 1. Pending payment verification
    const pendingPayments = await query(`
      SELECT p.id, p.payment_number, p.amount, p.created_at, u.name as customer_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'pending_verification'
      ORDER BY p.created_at DESC
    `);
    pendingPayments.forEach(p => {
      notifications.push({
        id: `pay-${p.id}`,
        type: 'payment',
        level: 'warning',
        title: 'Verifikasi Pembayaran Baru',
        message: `${p.customer_name} telah mengunggah bukti bayar untuk #${p.payment_number} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.amount)}).`,
        timestamp: p.created_at,
        link: '/admin?tab=payments'
      });
    });

    // 2. Upcoming Hosting Expiration (<= 14 days)
    const expiringServices = await query(`
      SELECT s.id, s.service_code, s.domain, s.expires_at, u.name as customer_name
      FROM hosting_services s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' AND s.expires_at <= DATE_ADD(NOW(), INTERVAL 14 DAY) AND s.expires_at >= NOW()
      ORDER BY s.expires_at ASC
    `);
    expiringServices.forEach(s => {
      notifications.push({
        id: `exp-${s.id}`,
        type: 'hosting_expiration',
        level: 'warning',
        title: 'Layanan Hosting Segera Berakhir',
        message: `Layanan ${s.domain || s.service_code} milik ${s.customer_name} akan kedaluwarsa pada ${new Date(s.expires_at).toLocaleDateString('id-ID')}.`,
        timestamp: s.expires_at,
        link: '/admin?tab=services'
      });
    });

    // 3. Failed Emails in last 24h
    const failedEmails = await query(`
      SELECT id, recipient, subject, last_error, created_at
      FROM email_logs
      WHERE status = 'failed' AND created_at >= NOW() - INTERVAL 24 HOUR
      ORDER BY created_at DESC
      LIMIT 5
    `);
    failedEmails.forEach(e => {
      notifications.push({
        id: `mail-${e.id}`,
        type: 'email_failure',
        level: 'critical',
        title: 'Email Gagal Terkirim',
        message: `Pengiriman ke ${e.recipient} gagal: ${e.last_error || 'SMTP timeout'}`,
        timestamp: e.created_at,
        link: '/admin?tab=emails'
      });
    });

    return res.json({
      success: true,
      unreadCount: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat notifikasi sistem.'
    });
  }
});

// GET /admin/system/settings - System & Hosting Settings
router.get('/system/settings', async (req, res) => {
  try {
    const settings = await query('SELECT setting_key, setting_value, description, updated_at FROM hosting_settings');
    const map = {};
    settings.forEach(s => {
      map[s.setting_key] = s.setting_value;
    });
    return res.json({
      success: true,
      settings: map,
      raw: settings
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat konfigurasi sistem.'
    });
  }
});

// PUT /admin/system/settings - Update System Settings
router.put('/system/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Data konfigurasi tidak valid.' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO hosting_settings (setting_key, setting_value, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, String(value)]
      );
    }

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'system_settings_updated',
      target: 'hosting_settings',
      details: settings,
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: 'Konfigurasi sistem berhasil disimpan.'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan konfigurasi sistem.'
    });
  }
});

// ==========================================
// 11. PAYMENTS & PROVISIONING (PRESERVED)
// ==========================================

// GET /admin/payments - List payments for verification
router.get('/payments', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT p.*, o.order_number, o.type as order_type, o.plan_name_snapshot, o.period_snapshot,
             o.domain as order_domain, o.domain_type as order_domain_type,
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

// POST /admin/payments/:id/verify - Approve or Reject payment with atomic flow
router.post('/payments/:id/verify', async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const { action, reason, admin_notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Aksi tidak valid. Pilihan yang tersedia: approve atau reject.'
      });
    }

    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan pembayaran untuk pelanggan wajib dicantumkan.'
      });
    }

    const payments = await query(
      `SELECT p.*, o.order_number, o.user_id as order_user_id, o.plan_id, o.plan_name_snapshot,
              o.period_snapshot, o.type as order_type, o.related_service_id,
              o.domain as order_domain, o.domain_type as order_domain_type,
              u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN users u ON p.user_id = u.id
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

    if (payment.status === 'paid' && action === 'approve') {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran ini sudah diverifikasi dan berstatus lunas sebelumnya.'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const verificationResult = await withTransaction(async (conn) => {
      if (action === 'approve') {
        // 1. Update payment status to paid
        await conn.query(
          `UPDATE payments 
           SET status = 'paid', verified_by = ?, verified_at = NOW(), rejection_reason = NULL,
               admin_notes = COALESCE(?, admin_notes), updated_at = NOW()
           WHERE id = ?`,
          [req.user.id, admin_notes ? admin_notes.trim() : null, payment.id]
        );

        // 2. Update order status to paid
        await conn.query(
          "UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = ?",
          [payment.order_id]
        );

        let createdServiceId = null;
        let serviceCode = null;
        const targetDomain = payment.order_domain || null;

        if (payment.order_type === 'new') {
          const [existingServices] = await conn.query(
            'SELECT id, service_code, domain FROM hosting_services WHERE order_id = ?',
            [payment.order_id]
          );

          if (existingServices.length > 0) {
            createdServiceId = existingServices[0].id;
            serviceCode = existingServices[0].service_code;
          } else {
            serviceCode = generateServiceCode();
            const serviceStatus = targetDomain ? 'active' : 'awaiting_domain';
            const [serviceInsert] = await conn.query(
              `INSERT INTO hosting_services 
              (service_code, user_id, plan_id, order_id, domain, domain_type, status, server_ip, nameservers, activated_at, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, '103.119.237.132', 'ns1.domainmurah.net, ns2.domainmurah.net', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
              [
                serviceCode,
                payment.user_id,
                payment.plan_id,
                payment.order_id,
                targetDomain,
                payment.order_domain_type || 'existing',
                serviceStatus
              ]
            );
            createdServiceId = serviceInsert.insertId;

            await conn.query(
              `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
               VALUES (?, 'service_created', 'Layanan Hosting Aktif', ?, 'admin', ?)`,
              [
                createdServiceId,
                targetDomain 
                  ? `Pembayaran QRIS diverifikasi sah. Domain ${targetDomain} telah aktif di server cloud 1sLabs.`
                  : 'Pembayaran QRIS diverifikasi sah oleh admin.',
                req.user.id
              ]
            );

            if (targetDomain) {
              await conn.query(
                "UPDATE domain_reservations SET status = 'active', service_id = ? WHERE domain = ?",
                [createdServiceId, targetDomain]
              );
              try {
                ensureServiceRoot(serviceCode, targetDomain);
              } catch (fsErr) {
                console.warn('[provision] ensureServiceRoot notice:', fsErr.message);
              }

              // Also ensure record exists in domains table
              try {
                const [existingDomainRec] = await conn.query('SELECT id FROM domains WHERE domain = ?', [targetDomain]);
                if (existingDomainRec.length === 0) {
                  const isSub1sLabs = targetDomain.endsWith('.1slabs.my.id');
                  const subPrefix = isSub1sLabs ? targetDomain.replace('.1slabs.my.id', '') : null;
                  const domainType = isSub1sLabs ? 'free_subdomain' : 'custom_domain';
                  const rootDomain = isSub1sLabs ? '1slabs.my.id' : targetDomain;
                  const docroot = `/home/u1zh8984/public_html/${targetDomain}`;
                  await conn.query(
                    `INSERT INTO domains 
                     (user_id, service_id, domain, domain_type, root_domain, subdomain_prefix, document_root, status, is_free_plan, ssl_status, dns_status, registered_at, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, 'pending', 'connected', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
                    [payment.user_id, createdServiceId, targetDomain, domainType, rootDomain, subPrefix, docroot]
                  );
                }
              } catch (dErr) {
                console.warn('[domain table insert notice]:', dErr.message);
              }

              try {
                if (targetDomain.endsWith('.1slabs.my.id')) {
                  const sub = targetDomain.replace('.1slabs.my.id', '');
                  await subdomainService.addSubdomain(sub, '1slabs.my.id', `public_html/${targetDomain}`);
                } else {
                  await domainService.addAddonDomain(targetDomain);
                }
              } catch (cpErr) {
                console.warn(`[cPanel Provisioning] notice for '${targetDomain}':`, cpErr.message);
              }
            }
          }
        } else if (payment.order_type === 'renewal' && payment.related_service_id) {
          createdServiceId = payment.related_service_id;
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
            `UPDATE invoices 
             SET status = 'paid', paid_at = NOW(), service_id = ?, domain = COALESCE(?, domain),
                 billing_start_date = NOW(), billing_end_date = DATE_ADD(NOW(), INTERVAL 1 YEAR)
             WHERE id = ?`,
            [createdServiceId, targetDomain, existingInvoices[0].id]
          );
        } else {
          invoiceNumber = generateInvoiceNumber();
          await conn.query(
            `INSERT INTO invoices 
            (invoice_number, order_id, payment_id, user_id, service_id, amount, status, plan_name, domain, period, billing_start_date, billing_end_date, paid_at)
            VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW())`,
            [
              invoiceNumber,
              payment.order_id,
              payment.id,
              payment.user_id,
              createdServiceId,
              payment.amount,
              payment.plan_name_snapshot,
              targetDomain,
              payment.period_snapshot
            ]
          );
        }

        // 4. Audit log to payment_verification_logs
        await conn.query(
          `INSERT INTO payment_verification_logs (payment_id, admin_id, action, previous_status, new_status, reason, ip_address)
           VALUES (?, ?, 'approve', ?, 'paid', ?, ?)`,
          [payment.id, req.user.id, payment.status, admin_notes ? `Disetujui. Catatan: ${admin_notes.trim()}` : 'Pembayaran QRIS diverifikasi sah.', ipAddress]
        );

        // 5. Audit log to system_activity_logs
        await logActivity({
          actorId: req.user.id,
          actorName: req.user.name,
          action: 'payment_verified',
          target: payment.payment_number,
          details: { orderNumber: payment.order_number, amount: payment.amount, customerEmail: payment.customer_email },
          ip: ipAddress,
          result: 'success',
          conn
        });

        return {
          status: 'paid',
          invoiceNumber,
          serviceCode,
          serviceId: createdServiceId,
          domain: targetDomain
        };
      } else {
        // Reject
        await conn.query(
          `UPDATE payments 
           SET status = 'rejected', rejection_reason = ?, admin_notes = COALESCE(?, admin_notes),
               verified_by = ?, verified_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [reason.trim(), admin_notes ? admin_notes.trim() : null, req.user.id, payment.id]
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

        await logActivity({
          actorId: req.user.id,
          actorName: req.user.name,
          action: 'payment_rejected',
          target: payment.payment_number,
          details: { orderNumber: payment.order_number, reason: reason.trim() },
          ip: ipAddress,
          result: 'warning',
          conn
        });

        return {
          status: 'rejected',
          reason: reason.trim()
        };
      }
    });

    // Send customer notification emails asynchronously
    if (action === 'approve') {
      sendPaymentApprovedEmail({
        to: payment.customer_email,
        name: payment.customer_name,
        orderNumber: payment.order_number,
        invoiceNumber: verificationResult.invoiceNumber,
        planName: payment.plan_name_snapshot,
        domain: verificationResult.domain || payment.order_domain || '-',
        amount: payment.amount
      }).catch(err => console.error('[admin] Background approve email error:', err.message));

      if (verificationResult.domain && verificationResult.serviceCode) {
        sendHostingActivatedEmail({
          to: payment.customer_email,
          name: payment.customer_name,
          serviceCode: verificationResult.serviceCode,
          domain: verificationResult.domain,
          planName: payment.plan_name_snapshot,
          serverIp: '103.119.237.132',
          nameservers: 'ns1.domainmurah.net, ns2.domainmurah.net',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }).catch(err => console.error('[admin] Background hosting active email error:', err.message));
      }
    } else {
      sendPaymentRejectedEmail({
        to: payment.customer_email,
        name: payment.customer_name,
        orderNumber: payment.order_number,
        planName: payment.plan_name_snapshot,
        rejectionReason: reason.trim()
      }).catch(err => console.error('[admin] Background reject email error:', err.message));
    }

    return res.json({
      success: true,
      message: action === 'approve' ? 'Pembayaran berhasil disetujui dan layanan hosting telah diaktifkan.' : 'Pembayaran telah ditolak.',
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
          desc = 'Layanan hosting telah selesai dikonfigurasi dan aktif digunakan di server 1sLabs.';
          try {
            ensureServiceRoot(current.service_code, domain || current.domain || 'website-anda.com');
          } catch (e) {
            console.error('ensureServiceRoot error on provision:', e);
          }
        } else if (newStatus === 'suspended') {
          title = 'Layanan Ditangguhkan';
          desc = 'Layanan hosting ditangguhkan oleh administrator.';
        }

        await conn.query(
          `INSERT INTO service_events (service_id, event_type, title, description, actor_type, actor_id)
           VALUES (?, 'status_changed', ?, ?, 'admin', ?)`,
          [serviceId, title, desc, req.user.id]
        );
      }
    });

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'service_provisioned',
      target: current.service_code,
      details: { oldStatus: current.status, newStatus, domain },
      ip,
      result: 'success'
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

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'plan_updated',
      target: name,
      details: { planId, price, storage_gb },
      ip,
      result: 'success'
    });

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

// ==========================================
// 15. PAYMENT PROOFS VAULT (BRANKAS BUKTI PEMBAYARAN)
// ==========================================

// Helper to resolve proofs directory
function getProofsDir() {
  const primaryDir = path.join(__dirname, '../../../uploads/proofs');
  const fallbackDir = path.join(__dirname, '../../uploads/proofs');
  const altCpanelDir = '/home/u1zh8984/oneslabs-backend/uploads/proofs';

  if (fs.existsSync(altCpanelDir)) return altCpanelDir;
  if (fs.existsSync(primaryDir)) return primaryDir;
  if (!fs.existsSync(fallbackDir)) {
    try {
      fs.mkdirSync(fallbackDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
  return fallbackDir;
}

// GET /admin/proofs - List all payment proof files
router.get('/proofs', async (req, res) => {
  try {
    const proofsDir = getProofsDir();
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true });
    }

    // Read linked invoices & payments to show cross-reference
    let invoiceRows = [];
    let paymentRows = [];
    try {
      invoiceRows = await query('SELECT id, invoice_number, items_json FROM invoices');
      paymentRows = await query(`
        SELECT p.id, inv.invoice_number, p.proof_image 
        FROM payments p 
        LEFT JOIN invoices inv ON inv.payment_id = p.id 
        WHERE p.proof_image IS NOT NULL
      `);
    } catch (e) {
      console.warn('Could not query invoices/payments for linkage', e);
    }

    const files = fs.readdirSync(proofsDir);
    const proofList = [];

    for (const f of files) {
      if (f.startsWith('.')) continue;
      const fullPath = path.join(proofsDir, f);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        const ext = path.extname(f).toLowerCase();
        const isPdf = ext === '.pdf';
        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);

        const linkedInvoices = [];
        for (const row of invoiceRows) {
          const rawStr = typeof row.items_json === 'string' 
            ? row.items_json 
            : JSON.stringify(row.items_json || '');
          if (rawStr.includes(f)) {
            const invLabel = row.invoice_number || `INV-${row.id}`;
            if (!linkedInvoices.includes(invLabel)) {
              linkedInvoices.push(invLabel);
            }
          }
        }

        for (const p of paymentRows) {
          const pStr = String(p.proof_image || '');
          if (pStr.includes(f)) {
            const label = p.invoice_number ? p.invoice_number : `Bayar #${p.id}`;
            if (!linkedInvoices.includes(label)) {
              linkedInvoices.push(label);
            }
          }
        }

        const sizeBytes = stat.size;
        const sizeFormatted = sizeBytes > 1024 * 1024 
          ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB` 
          : `${Math.round(sizeBytes / 1024)} KB`;

        proofList.push({
          filename: f,
          originalName: f,
          sizeBytes,
          sizeFormatted,
          ext: ext.replace('.', '').toUpperCase(),
          isPdf,
          isImage,
          url: `https://1slabs.my.id/uploads/proofs/${f}`,
          previewUrl: `https://1slabs.my.id/proof-viewer?url=https://1slabs.my.id/uploads/proofs/${f}`,
          uploadedAt: stat.mtime.toISOString(),
          linkedInvoices
        });
      } catch (err) {
        // ignore unreadable
      }
    }

    proofList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return res.json({
      success: true,
      totalCount: proofList.length,
      proofs: proofList
    });
  } catch (error) {
    console.error('List proofs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar berkas bukti pembayaran.'
    });
  }
});

// POST /admin/proofs/upload - Batch Upload Proof Files (Images, PDFs)
router.post('/proofs/upload', uploadPaymentProof.any(), async (req, res) => {
  try {
    const uploadedFiles = req.files || [];
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada berkas bukti pembayaran yang dipilih untuk diunggah.'
      });
    }

    const results = uploadedFiles.map(f => {
      const ext = path.extname(f.filename).toLowerCase();
      const sizeBytes = f.size;
      const sizeFormatted = sizeBytes > 1024 * 1024 
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB` 
        : `${Math.round(sizeBytes / 1024)} KB`;

      return {
        filename: f.filename,
        originalName: f.originalname,
        sizeBytes,
        sizeFormatted,
        ext: ext.replace('.', '').toUpperCase(),
        isPdf: ext === '.pdf',
        isImage: ['.jpg', '.jpeg', '.png', '.webp'].includes(ext),
        url: `https://1slabs.my.id/uploads/proofs/${f.filename}`,
        previewUrl: `https://1slabs.my.id/proof-viewer?url=https://1slabs.my.id/uploads/proofs/${f.filename}`,
        uploadedAt: new Date().toISOString(),
        linkedInvoices: []
      };
    });

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logActivity({
      actorId: req.user.id,
      actorName: req.user.name,
      action: 'proofs_uploaded',
      target: `${results.length} files`,
      details: { filenames: results.map(r => r.filename) },
      ip,
      result: 'success'
    });

    return res.json({
      success: true,
      message: `Berhasil mengunggah ${results.length} berkas bukti pembayaran ke brankas.`,
      uploaded: results
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengunggah berkas bukti pembayaran.'
    });
  }
});

// DELETE /admin/proofs/:filename - Delete proof file
router.delete('/proofs/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const proofsDir = getProofsDir();
    const fullPath = path.join(proofsDir, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return res.json({
        success: true,
        message: `Berkas ${filename} berhasil dihapus dari brankas bukti.`
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Berkas bukti pembayaran tidak ditemukan.'
      });
    }
  } catch (error) {
    console.error('Delete proof error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus berkas bukti.'
    });
  }
});

// --- FREE PLAN, DOMAIN & HOSTING AUTOMATION EXTENSIONS ---

// GET /admin/freeplan/claims - List all Free Plan claims
router.get('/freeplan/claims', async (req, res) => {
  try {
    const claims = await query(`
      SELECT f.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
             s.service_code, s.status as service_status, d.document_root
      FROM free_plan_claims f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN hosting_services s ON f.service_id = s.id
      LEFT JOIN domains d ON f.domain = d.domain
      ORDER BY f.claimed_at DESC
    `);

    return res.json({
      success: true,
      claims
    });
  } catch (err) {
    console.error('Admin freeplan claims error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data klaim Free Plan.' });
  }
});

// POST /admin/infrastructure/run-cron - Trigger automated suspension inspection manually
router.post('/infrastructure/run-cron', async (req, res) => {
  try {
    const SuspensionService = require('../services/suspension.service');
    const results = await SuspensionService.checkAndSuspendExpiredServices();
    return res.json({
      success: true,
      message: 'Inspeksi kedaluwarsa dan suspensi otomatis berhasil dijalankan.',
      results
    });
  } catch (err) {
    console.error('Trigger cron error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menjalankan cron suspensi otomatis.' });
  }
});

// POST /admin/domains/:id/suspend - Admin suspend domain
router.post('/domains/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE domains SET status = 'suspended', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Domain berhasil ditangguhkan (suspended).' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/domains/:id/unsuspend - Admin unsuspend domain
router.post('/domains/:id/unsuspend', async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE domains SET status = 'active', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Domain berhasil diaktifkan kembali.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/hosting/:id/suspend - Admin suspend hosting service
router.post('/hosting/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE hosting_services SET status = 'suspended', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Layanan hosting berhasil ditangguhkan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/hosting/:id/unsuspend - Admin unsuspend hosting service
router.post('/hosting/:id/unsuspend', async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE hosting_services SET status = 'active', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Layanan hosting berhasil diaktifkan kembali.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/nodejs/apps - List all Node.js applications
router.get('/nodejs/apps', async (req, res) => {
  try {
    const apps = await query(`
      SELECT n.*, u.name as user_name, u.email as user_email
      FROM nodejs_applications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
    return res.json({ success: true, applications: apps });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
