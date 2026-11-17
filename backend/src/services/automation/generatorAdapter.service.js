const { query } = require('../../db');

const DEFAULT_LOCAL_ENGINE_URL = 'http://127.0.0.1:8000';

function sanitizeErrorMessage(raw) {
  let msg = String(raw || 'Kesalahan komunikasi dengan engine generator.');
  msg = msg.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]');
  msg = msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
  msg = msg.replace(/(key|token|secret|password)\s*[=:]\s*[^\s,;]+/gi, '$1=[REDACTED]');
  return msg.slice(0, 600);
}

function getIntegrationKey() {
  return (
    process.env.GENERATOR_INTEGRATION_KEY ||
    process.env.SLABS_INTEGRATION_KEY ||
    process.env.STORE_INTEGRATION_KEY ||
    ''
  ).trim();
}

async function resolveEngineUrl(explicitUrl = null) {
  if (explicitUrl && String(explicitUrl).trim()) {
    return String(explicitUrl).trim().replace(/\/+$/, '');
  }
  try {
    const rows = await query('SELECT engine_url FROM content_automation_settings WHERE id = 1 LIMIT 1');
    if (rows.length > 0 && rows[0].engine_url) {
      return String(rows[0].engine_url).trim().replace(/\/+$/, '');
    }
  } catch {
    // Table may not exist on first bootstrap
  }
  return String(process.env.GENERATOR_API_URL || DEFAULT_LOCAL_ENGINE_URL).trim().replace(/\/+$/, '');
}

async function adapterFetch(baseUrl, path, { method = 'GET', body = null, timeoutMs = 60000 } = {}) {
  const key = getIntegrationKey();
  const headers = {
    Accept: 'application/json'
  };
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  if (key) {
    headers['X-Integration-Key'] = key;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });

  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { detail: text };
  }

  if (!res.ok) {
    const detail = parsed?.detail || parsed?.message || `HTTP ${res.status}`;
    const err = new Error(sanitizeErrorMessage(detail));
    err.statusCode = res.status;
    throw err;
  }

  return parsed;
}

/**
 * Checks whether the local Python Article Generator service adapter is reachable and configured.
 */
async function checkEngineHealth(engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  const keyConfigured = Boolean(getIntegrationKey());
  const started = Date.now();
  try {
    const data = await adapterFetch(baseUrl, '/api/v1/1slabs/health', {
      method: 'GET',
      timeoutMs: 8000
    });
    return {
      reachable: true,
      ok: Boolean(data?.success),
      engine_url: baseUrl,
      key_configured: keyConfigured,
      gemini_configured: Boolean(data?.gemini_configured),
      engine: data?.engine || '1slabs-article-generator-adapter',
      version: data?.version || '1.0.0',
      latency_ms: Date.now() - started,
      error: null
    };
  } catch (err) {
    return {
      reachable: false,
      ok: false,
      engine_url: baseUrl,
      key_configured: keyConfigured,
      gemini_configured: false,
      engine: null,
      version: null,
      latency_ms: Date.now() - started,
      error: sanitizeErrorMessage(err?.message || err)
    };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invokes the Python Article Generator adapter endpoint `/api/v1/1slabs/generate`.
 * Supports async polling with stage progress callbacks and cancellation checks.
 */
async function generateArticle({
  payload,
  engineUrl = null,
  asyncMode = true,
  onProgress = null,
  isCancelled = null,
  pollIntervalMs = 1500,
  timeoutMs = 420000
}) {
  const baseUrl = await resolveEngineUrl(engineUrl);
  const startRes = await adapterFetch(baseUrl, '/api/v1/1slabs/generate', {
    method: 'POST',
    body: {
      ...payload,
      async_mode: Boolean(asyncMode)
    },
    timeoutMs: asyncMode ? 30000 : timeoutMs
  });

  if (!startRes?.async || !startRes?.job_id) {
    if (!startRes?.article) {
      throw new Error('Engine tidak mengembalikan hasil artikel.');
    }
    return {
      engine_job_id: null,
      article: startRes.article
    };
  }

  const jobId = startRes.job_id;
  const deadline = Date.now() + timeoutMs;

  if (typeof onProgress === 'function') {
    await onProgress({
      engine_job_id: jobId,
      stage: 'queued',
      progress: 5,
      detail: 'Job diterima oleh engine generator lokal.'
    });
  }

  let lastStage = '';
  while (Date.now() < deadline) {
    if (typeof isCancelled === 'function' && (await isCancelled())) {
      const cancelErr = new Error('Generasi dibatalkan oleh admin.');
      cancelErr.code = 'CANCELLED';
      throw cancelErr;
    }

    await sleep(pollIntervalMs);

    const statusRes = await adapterFetch(baseUrl, `/api/v1/1slabs/jobs/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      timeoutMs: 15000
    });
    const job = statusRes?.job || {};

    if (job.stage && job.stage !== lastStage && typeof onProgress === 'function') {
      lastStage = job.stage;
      await onProgress({
        engine_job_id: jobId,
        stage: job.stage,
        progress: Number(job.progress || 0),
        detail: job.detail || ''
      });
    }

    if (job.status === 'completed' && job.result) {
      return {
        engine_job_id: jobId,
        article: job.result
      };
    }

    if (job.status === 'failed') {
      throw new Error(sanitizeErrorMessage(job.error || 'Engine gagal menghasilkan artikel.'));
    }
  }

  throw new Error(`Timeout menunggu engine generator (${Math.round(timeoutMs / 1000)} detik).`);
}

/**
 * Requests service-oriented topic research from the local Python engine adapter.
 */
async function researchTopics(payload, engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  return adapterFetch(baseUrl, '/api/v1/1slabs/research-topics', {
    method: 'POST',
    body: payload,
    timeoutMs: 90000
  });
}

async function planImages(payload, engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  return adapterFetch(baseUrl, '/api/v1/1slabs/plan-images', {
    method: 'POST',
    body: payload,
    timeoutMs: 45000
  });
}

async function rankImages(payload, engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  return adapterFetch(baseUrl, '/api/v1/1slabs/rank-images', {
    method: 'POST',
    body: payload,
    timeoutMs: 35000
  });
}

async function optimizeImageWithEngine(payload, engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  return adapterFetch(baseUrl, '/api/v1/1slabs/optimize-image', {
    method: 'POST',
    body: payload,
    timeoutMs: 30000
  });
}

async function generateAiImageFallback(payload, engineUrlOverride = null) {
  const baseUrl = await resolveEngineUrl(engineUrlOverride);
  return adapterFetch(baseUrl, '/api/v1/1slabs/generate-image-fallback', {
    method: 'POST',
    body: payload,
    timeoutMs: 60000
  });
}

module.exports = {
  checkEngineHealth,
  generateArticle,
  researchTopics,
  planImages,
  rankImages,
  optimizeImageWithEngine,
  generateAiImageFallback,
  resolveEngineUrl,
  sanitizeErrorMessage
};

