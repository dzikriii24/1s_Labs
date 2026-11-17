const crypto = require('crypto');
const { query } = require('../../db');

const CALLBACK_PATH = '/api/seo-intelligence/gsc/callback';
const GSC_SCOPE = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

function resolveBaseOrigin(req) {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.get('host') || '1slabs.my.id').split(',')[0].trim();
  return `${proto}://${host}`;
}

function getRedirectUri(req) {
  return `${resolveBaseOrigin(req)}${CALLBACK_PATH}`;
}

async function getRawSettings() {
  const rows = await query('SELECT * FROM blog_gsc_settings WHERE id = 1 LIMIT 1');
  if (rows[0]) return rows[0];
  await query("INSERT IGNORE INTO blog_gsc_settings (id, site_url) VALUES (1, 'https://1slabs.my.id')");
  const retry = await query('SELECT * FROM blog_gsc_settings WHERE id = 1 LIMIT 1');
  return retry[0];
}

async function getPublicSettings(req) {
  const row = await getRawSettings();
  const hasSecret = Boolean(row.client_secret && row.client_secret.trim());
  const isConnected = Boolean(row.refresh_token || row.access_token);
  return {
    site_url: row.site_url || 'https://1slabs.my.id',
    client_id: row.client_id || '',
    has_client_secret: hasSecret,
    client_secret_masked: hasSecret ? '••••••••••••••••' + row.client_secret.slice(-4) : '',
    redirect_uri: req ? getRedirectUri(req) : `https://1slabs.my.id${CALLBACK_PATH}`,
    connected: isConnected,
    connected_email: row.connected_email || null,
    last_synced_at: row.last_synced_at || null
  };
}

async function saveCredentials({ site_url, client_id, client_secret }) {
  const current = await getRawSettings();
  const nextSite = String(site_url || current.site_url || 'https://1slabs.my.id').trim();
  const nextClientId = client_id !== undefined ? String(client_id).trim() : current.client_id;
  // Preserve existing secret if user leaves field blank or sends masked bullets
  let nextSecret = current.client_secret;
  if (client_secret !== undefined) {
    const trimmed = String(client_secret).trim();
    if (trimmed && !trimmed.includes('••••')) {
      nextSecret = trimmed;
    }
  }

  await query(
    `UPDATE blog_gsc_settings
     SET site_url = ?, client_id = ?, client_secret = ?
     WHERE id = 1`,
    [nextSite, nextClientId, nextSecret]
  );
}

async function disconnectGsc() {
  await query(
    `UPDATE blog_gsc_settings
     SET access_token = NULL, refresh_token = NULL, token_expires_at = NULL,
         oauth_state = NULL, oauth_state_expires_at = NULL, connected_email = NULL
     WHERE id = 1`
  );
}

async function createAuthUrl(req) {
  const settings = await getRawSettings();
  if (!settings.client_id || !settings.client_secret) {
    throw new Error('Client ID dan Client Secret Google OAuth harus disimpan terlebih dahulu.');
  }
  const state = crypto.randomBytes(24).toString('hex');
  await query(
    `UPDATE blog_gsc_settings
     SET oauth_state = ?, oauth_state_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
     WHERE id = 1`,
    [state]
  );

  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: settings.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GSC_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });

  return {
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri
  };
}

async function handleOAuthCallback(req, { code, state }) {
  const settings = await getRawSettings();
  if (!state || !settings.oauth_state || state !== settings.oauth_state) {
    throw new Error('OAuth state tidak valid atau kadaluarsa. Ulangi proses koneksi dari dashboard Admin.');
  }
  if (settings.oauth_state_expires_at && new Date(settings.oauth_state_expires_at).getTime() < Date.now()) {
    throw new Error('Sesi otorisasi GSC sudah kadaluarsa. Silakan hubungkan kembali.');
  }

  const redirectUri = getRedirectUri(req);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Gagal menukar authorization code dengan Google token.');
  }

  let email = settings.connected_email || null;
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (userRes.ok) {
      const userJson = await userRes.json();
      if (userJson.email) email = userJson.email;
    }
  } catch {
    // Non-critical if userinfo unavailable
  }

  const expiresInSec = Number(tokenData.expires_in || 3500);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  const nextRefresh = tokenData.refresh_token || settings.refresh_token;

  await query(
    `UPDATE blog_gsc_settings
     SET access_token = ?, refresh_token = ?, token_expires_at = ?,
         connected_email = ?, oauth_state = NULL, oauth_state_expires_at = NULL
     WHERE id = 1`,
    [tokenData.access_token, nextRefresh, expiresAt, email]
  );

  return { connected: true, email };
}

async function getValidAccessToken() {
  const settings = await getRawSettings();
  if (!settings.access_token && !settings.refresh_token) {
    throw new Error('Google Search Console belum terhubung. Silakan hubungkan akun Google Anda.');
  }

  const isExpiring = !settings.token_expires_at || (new Date(settings.token_expires_at).getTime() - 120000 < Date.now());
  if (!isExpiring && settings.access_token) {
    return { accessToken: settings.access_token, settings };
  }

  if (!settings.refresh_token) {
    throw new Error('Refresh token tidak tersedia. Silakan hubungkan ulang Google Search Console.');
  }

  const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      refresh_token: settings.refresh_token,
      grant_type: 'refresh_token'
    }).toString()
  });

  const data = await refreshRes.json();
  if (!refreshRes.ok || !data.access_token) {
    throw new Error(`Gagal memperbarui token GSC: ${data.error_description || data.error || 'Unknown error'}`);
  }

  const expiresAt = new Date(Date.now() + Number(data.expires_in || 3500) * 1000);
  await query(
    'UPDATE blog_gsc_settings SET access_token = ?, token_expires_at = ? WHERE id = 1',
    [data.access_token, expiresAt]
  );

  return { accessToken: data.access_token, settings };
}

function extractHost(urlOrProperty) {
  return String(urlOrProperty || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^sc-domain:/i, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();
}

function hostsRelated(a, b) {
  const ha = extractHost(a).replace(/^www\./, '');
  const hb = extractHost(b).replace(/^www\./, '');
  if (!ha || !hb) return false;
  return ha === hb || ha.endsWith(`.${hb}`) || hb.endsWith(`.${ha}`);
}

function buildPropertyCandidates(siteUrl) {
  const raw = String(siteUrl || 'https://1slabs.my.id').trim();
  const host = extractHost(raw);
  const hostNoWww = host.replace(/^www\./, '');
  const list = [];

  // Only include raw directly if it already looks like a GSC property (`sc-domain:` or origin/prefix)
  if (/^sc-domain:/i.test(raw)) {
    list.push(raw.toLowerCase());
  } else if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.pathname === '/' || u.pathname === '') {
        list.push(`${u.origin}/`, u.origin);
      } else {
        list.push(`${u.origin}/`);
      }
    } catch {
      list.push(raw);
    }
  }

  if (host) {
    list.push(`sc-domain:${host}`, `https://${host}/`);
  }
  if (hostNoWww) {
    list.push(`sc-domain:${hostNoWww}`, `https://${hostNoWww}/`, `https://www.${hostNoWww}/`);
    const labels = hostNoWww.split('.').filter(Boolean);
    for (let i = 1; i <= labels.length - 2; i += 1) {
      const parentHost = labels.slice(i).join('.');
      list.push(`sc-domain:${parentHost}`, `https://${parentHost}/`);
    }
  }
  return Array.from(new Set(list.filter(Boolean)));
}

async function queryGscAnalytics(accessToken, propertyUrl, payload) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Sync real GSC query & page metrics (28d vs previous 28d) into blog_gsc_performance.
 */
async function syncPerformanceData() {
  const { accessToken, settings } = await getValidAccessToken();
  const candidates = buildPropertyCandidates(settings.site_url);

  const endDate = new Date(Date.now() - 2 * 86400000); // GSC data has ~2 day lag
  const startDate = new Date(endDate.getTime() - 27 * 86400000);
  const prevEnd = new Date(startDate.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - 27 * 86400000);

  const curStartStr = formatIsoDate(startDate);
  const curEndStr = formatIsoDate(endDate);
  const prevStartStr = formatIsoDate(prevStart);
  const prevEndStr = formatIsoDate(prevEnd);

  let activeProperty = null;
  let queryRows = [];
  let lastErrorMsg = '';

  for (const candidate of candidates) {
    const attempt = await queryGscAnalytics(accessToken, candidate, {
      startDate: curStartStr,
      endDate: curEndStr,
      dimensions: ['query', 'page'],
      rowLimit: 250
    });
    if (attempt.ok) {
      activeProperty = candidate;
      queryRows = attempt.json.rows || [];
      break;
    }
    lastErrorMsg = attempt.json?.error?.message || `HTTP ${attempt.status}`;
  }

  if (!activeProperty) {
    throw new Error(`Google Search Console API menolak akses properti '${settings.site_url}': ${lastErrorMsg}. Pastikan akun Google Anda terdaftar sebagai Owner/Full User di Google Search Console.`);
  }

  // Fetch previous 28d period for comparison
  const prevAttempt = await queryGscAnalytics(accessToken, activeProperty, {
    startDate: prevStartStr,
    endDate: prevEndStr,
    dimensions: ['query', 'page'],
    rowLimit: 250
  });
  const prevMap = new Map();
  if (prevAttempt.ok && Array.isArray(prevAttempt.json.rows)) {
    for (const r of prevAttempt.json.rows) {
      const k = `${r.keys?.[0] || ''}||${r.keys?.[1] || ''}`;
      prevMap.set(k, r);
    }
  }

  await query('DELETE FROM blog_gsc_performance');

  for (const row of queryRows) {
    const qText = row.keys?.[0] || '';
    const pUrl = row.keys?.[1] || '';
    const prev = prevMap.get(`${qText}||${pUrl}`);
    await query(
      `INSERT INTO blog_gsc_performance
       (site_url, query_text, page_url, clicks, impressions, ctr, position, prev_clicks, prev_impressions, prev_position, date_range_start, date_range_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activeProperty,
        qText.slice(0, 250),
        pUrl.slice(0, 490),
        Math.round(row.clicks || 0),
        Math.round(row.impressions || 0),
        Number(row.ctr || 0),
        Number((row.position || 0).toFixed(2)),
        Math.round(prev?.clicks || 0),
        Math.round(prev?.impressions || 0),
        Number((prev?.position || 0).toFixed(2)),
        curStartStr,
        curEndStr
      ]
    );
  }

  await query('UPDATE blog_gsc_settings SET last_synced_at = NOW(), site_url = ? WHERE id = 1', [activeProperty]);

  return {
    synced_rows: queryRows.length,
    property: activeProperty,
    date_range: { start: curStartStr, end: curEndStr }
  };
}

async function getPerformanceDashboard() {
  const rows = await query(
    `SELECT * FROM blog_gsc_performance ORDER BY impressions DESC, clicks DESC LIMIT 250`
  );

  let totalClicks = 0;
  let totalImpressions = 0;
  let weightedPosition = 0;
  let prevClicks = 0;
  let prevImpressions = 0;

  for (const r of rows) {
    totalClicks += Number(r.clicks || 0);
    totalImpressions += Number(r.impressions || 0);
    weightedPosition += Number(r.position || 0) * Math.max(1, Number(r.impressions || 0));
    prevClicks += Number(r.prev_clicks || 0);
    prevImpressions += Number(r.prev_impressions || 0);
  }

  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const avgPos = totalImpressions > 0 ? Number((weightedPosition / totalImpressions).toFixed(1)) : 0;

  // Aggregate by page URL
  const pageMap = new Map();
  for (const r of rows) {
    if (!r.page_url) continue;
    const cur = pageMap.get(r.page_url) || { page_url: r.page_url, clicks: 0, impressions: 0, posSum: 0, count: 0 };
    cur.clicks += Number(r.clicks || 0);
    cur.impressions += Number(r.impressions || 0);
    cur.posSum += Number(r.position || 0) * Math.max(1, Number(r.impressions || 0));
    cur.count += 1;
    pageMap.set(r.page_url, cur);
  }
  const topPages = Array.from(pageMap.values())
    .map((p) => ({
      page_url: p.page_url,
      clicks: p.clicks,
      impressions: p.impressions,
      ctr: p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(2)) : 0,
      position: p.impressions > 0 ? Number((p.posSum / p.impressions).toFixed(1)) : 0
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 20);

  // Quick-win opportunities: positions 5-20 or high impressions + CTR < 3%
  const opportunities = rows
    .filter((r) => Number(r.impressions) >= 20 && (Number(r.position) >= 4.5 && Number(r.position) <= 25 || Number(r.ctr) < 0.03))
    .slice(0, 20);

  // Declining queries vs prev 28d
  const declining = rows
    .filter((r) => Number(r.prev_clicks) > 0 && Number(r.clicks) < Number(r.prev_clicks))
    .sort((a, b) => (a.clicks - a.prev_clicks) - (b.clicks - b.prev_clicks))
    .slice(0, 15);

  return {
    summary: {
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      avg_ctr_percent: avgCtr,
      avg_position: avgPos,
      prev_clicks: prevClicks,
      prev_impressions: prevImpressions,
      row_count: rows.length,
      date_range_start: rows[0]?.date_range_start || null,
      date_range_end: rows[0]?.date_range_end || null
    },
    topQueries: rows.slice(0, 40),
    topPages,
    opportunities,
    declining
  };
}

module.exports = {
  getPublicSettings,
  saveCredentials,
  disconnectGsc,
  createAuthUrl,
  handleOAuthCallback,
  syncPerformanceData,
  getPerformanceDashboard,
  getValidAccessToken,
  buildPropertyCandidates,
  extractHost,
  hostsRelated
};

