const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Helper to detect Device and Browser from User-Agent
function parseUserAgent(ua) {
  if (!ua) return { device: 'Desktop', browser: 'Chrome' };
  let device = 'Desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    device = 'Tablet';
  }

  let browser = 'Chrome';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  return { device, browser };
}

// ----------------------------------------------------
// 1. PUBLIC INGESTION: ALL /api/analytics/collect
// (Zero auth, public CORS, accepts JSON, text, beacon, and query params)
// ----------------------------------------------------
router.all('/collect', express.text({ type: '*/*' }), async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body || typeof body !== 'object') {
      body = {};
    }

    const serviceCode = body.serviceCode || req.query.serviceCode;
    const eventType = body.eventType || req.query.eventType || 'pageview';
    const pageUrl = body.pageUrl || req.query.pageUrl || req.headers.referer || '';
    const pagePath = body.pagePath || req.query.pagePath || '/';
    const pageTitle = body.pageTitle || req.query.pageTitle || '';
    const referrer = body.referrer || req.query.referrer || '';
    const visitorId = body.visitorId || req.query.visitorId;
    const elementText = body.elementText || req.query.elementText || null;
    const elementTag = body.elementTag || req.query.elementTag || null;
    const screen = body.screen || req.query.screen || '';

    if (!serviceCode) {
      return res.status(200).json({ success: false, message: 'serviceCode is required.' });
    }

    // Lookup service domain
    const services = await query('SELECT domain FROM hosting_services WHERE service_code = ? LIMIT 1', [serviceCode]);
    const domain = services.length > 0 ? services[0].domain : 'unknown';

    const ua = req.headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(ua);
    const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress || '';

    // Anonymized fallback visitor ID if client localStorage is blocked
    const fallbackVisitorId = visitorId || crypto.createHash('sha256').update(`${ip}-${ua}-${new Date().toISOString().slice(0, 10)}`).digest('hex').slice(0, 20);

    const cleanPath = (pagePath || '/').slice(0, 255);
    const cleanTitle = (pageTitle || '').slice(0, 255);
    const cleanUrl = (pageUrl || '').slice(0, 500);
    const cleanRef = (referrer || '').slice(0, 500);
    const cleanElText = elementText ? elementText.slice(0, 255) : null;
    const cleanElTag = elementTag ? elementTag.slice(0, 50).toUpperCase() : null;

    await query(`
      INSERT INTO hosting_analytics 
      (service_code, domain, event_type, page_url, page_path, page_title, referrer, visitor_id, element_text, element_tag, device, browser, screen_resolution, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      serviceCode,
      domain,
      eventType === 'click' ? 'click' : 'pageview',
      cleanUrl,
      cleanPath,
      cleanTitle,
      cleanRef,
      fallbackVisitorId,
      cleanElText,
      cleanElTag,
      device,
      browser,
      screen.slice(0, 50),
      ip.slice(0, 45)
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Analytics Ingest Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ----------------------------------------------------
// 2. EMBEDDABLE TRACKER SCRIPT: GET /api/analytics/tracker.js
// ----------------------------------------------------
router.get('/tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const trackerJs = `/**
 * 1sLabs High-Accuracy Web Analytics Tracker
 * Self-hosted, privacy-focused, asynchronous
 */
(function() {
  try {
    var script = document.querySelector('script[data-service]') || document.currentScript;
    var serviceCode = script ? script.getAttribute('data-service') : 'SRV-2026-62DECA';
    if (!serviceCode) return;

    var endpoint = 'https://1slabs.my.id/api/analytics/collect';

    var vidKey = '_1slabs_vid';
    var visitorId = '';
    try {
      visitorId = localStorage.getItem(vidKey);
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem(vidKey, visitorId);
      }
    } catch(e) {
      visitorId = 'anon_' + Date.now();
    }

    function sendEvent(eventType, extra) {
      var payload = {
        serviceCode: serviceCode,
        eventType: eventType || 'pageview',
        pageUrl: window.location.href,
        pagePath: window.location.pathname || '/',
        pageTitle: document.title || '',
        referrer: document.referrer || '',
        visitorId: visitorId,
        screen: (window.screen ? window.screen.width + 'x' + window.screen.height : '')
      };
      if (extra) {
        if (extra.elementText) payload.elementText = extra.elementText;
        if (extra.elementTag) payload.elementTag = extra.elementTag;
      }
      var json = JSON.stringify(payload);

      // Priority 1: Modern fetch with keepalive & CORS
      if (window.fetch) {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
          keepalive: true,
          mode: 'cors',
          credentials: 'omit'
        }).catch(function() {
          sendFallback(payload, json);
        });
      } else {
        sendFallback(payload, json);
      }
    }

    function sendFallback(p, json) {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, json);
        } else {
          var img = new Image();
          img.src = endpoint + '?serviceCode=' + encodeURIComponent(p.serviceCode) +
            '&eventType=' + encodeURIComponent(p.eventType) +
            '&pagePath=' + encodeURIComponent(p.pagePath) +
            '&pageTitle=' + encodeURIComponent(p.pageTitle) +
            '&visitorId=' + encodeURIComponent(p.visitorId) +
            '&t=' + Date.now();
        }
      } catch(e) {}
    }

    // 1. Track initial Pageview (guaranteed trigger)
    var pageviewSent = false;
    function triggerPageview() {
      if (pageviewSent) return;
      pageviewSent = true;
      sendEvent('pageview');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', triggerPageview);
      window.addEventListener('load', triggerPageview);
    } else {
      triggerPageview();
    }
    setTimeout(triggerPageview, 250);

    // 2. Track Clicks (Accurate Button & Link Tracking)
    document.addEventListener('click', function(e) {
      var target = e.target && e.target.closest ? e.target.closest('a, button, [role="button"], input[type="submit"], input[type="button"]') : null;
      if (!target) return;
      var text = (target.innerText || target.value || target.getAttribute('aria-label') || target.title || '').trim();
      if (!text && target.href) text = target.href;
      sendEvent('click', {
        elementText: text ? text.substring(0, 100) : 'Interactive Element',
        elementTag: target.tagName || 'ELEMENT'
      });
    }, true);

    // 3. SPA Route Change Listener
    var pushState = history.pushState;
    if (pushState) {
      history.pushState = function() {
        pushState.apply(history, arguments);
        setTimeout(function() { sendEvent('pageview'); }, 50);
      };
    }
    window.addEventListener('popstate', function() {
      setTimeout(function() { sendEvent('pageview'); }, 50);
    });
  } catch(err) {}
})();
`;
  return res.send(trackerJs);
});

// ----------------------------------------------------
// 3. DASHBOARD STATS: GET /api/analytics/service/:serviceCode
// (Protected: owner or admin)
// ----------------------------------------------------
router.get('/service/:serviceCode', requireAuth, async (req, res) => {
  try {
    const { serviceCode } = req.params;
    const { range = '30d' } = req.query;

    // Check ownership
    const services = await query('SELECT * FROM hosting_services WHERE service_code = ?', [serviceCode]);
    if (services.length === 0) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan.' });
    }
    const service = services[0];
    if (req.user.role !== 'admin' && service.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    let dateCondition = 'created_at >= NOW() - INTERVAL 30 DAY';
    if (range === 'today') {
      dateCondition = 'DATE(created_at) = CURDATE()';
    } else if (range === '7d') {
      dateCondition = 'created_at >= NOW() - INTERVAL 7 DAY';
    } else if (range === 'all') {
      dateCondition = '1=1';
    }

    // 1. Summary
    const summaryRows = await query(`
      SELECT 
        SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) as total_pageviews,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as total_clicks
      FROM hosting_analytics 
      WHERE service_code = ? AND ${dateCondition}
    `, [serviceCode]);

    const totalPageviews = parseInt(summaryRows[0]?.total_pageviews || 0, 10);
    const uniqueVisitors = parseInt(summaryRows[0]?.unique_visitors || 0, 10);
    const totalClicks = parseInt(summaryRows[0]?.total_clicks || 0, 10);
    const clickRate = totalPageviews > 0 ? parseFloat(((totalClicks / totalPageviews) * 100).toFixed(1)) : 0;

    // 2. Top Pages
    const topPages = await query(`
      SELECT 
        page_path, 
        MAX(page_title) as page_title, 
        COUNT(*) as views, 
        COUNT(DISTINCT visitor_id) as visitors
      FROM hosting_analytics
      WHERE service_code = ? AND event_type = 'pageview' AND ${dateCondition}
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 8
    `, [serviceCode]);

    // 3. Top Clicks
    const topClicks = await query(`
      SELECT 
        element_text, 
        element_tag, 
        page_path, 
        COUNT(*) as count
      FROM hosting_analytics
      WHERE service_code = ? AND event_type = 'click' AND element_text IS NOT NULL AND ${dateCondition}
      GROUP BY element_text, element_tag, page_path
      ORDER BY count DESC
      LIMIT 8
    `, [serviceCode]);

    // 4. Devices
    const deviceRows = await query(`
      SELECT device, COUNT(*) as count 
      FROM hosting_analytics
      WHERE service_code = ? AND ${dateCondition}
      GROUP BY device
    `, [serviceCode]);

    // 5. Recent Activity
    const recentActivity = await query(`
      SELECT id, event_type, page_path, page_title, element_text, device, browser, created_at
      FROM hosting_analytics
      WHERE service_code = ?
      ORDER BY created_at DESC
      LIMIT 12
    `, [serviceCode]);

    // 6. Timeline (daily)
    const timeline = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) as views,
        COUNT(DISTINCT visitor_id) as visitors,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks
      FROM hosting_analytics
      WHERE service_code = ? AND ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [serviceCode]);

    return res.json({
      success: true,
      serviceCode,
      domain: service.domain,
      range,
      summary: {
        total_pageviews: totalPageviews,
        unique_visitors: uniqueVisitors,
        total_clicks: totalClicks,
        click_rate: clickRate
      },
      topPages,
      topClicks,
      devices: deviceRows,
      recentActivity,
      timeline
    });
  } catch (error) {
    console.error('[Analytics Fetch Error]:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat analitik website.' });
  }
});

module.exports = router;
