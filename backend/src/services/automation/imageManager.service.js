const crypto = require('crypto');
const dns = require('dns').promises;
const fs = require('fs');
const net = require('net');
const path = require('path');

const { query } = require('../../db');
const { slugify } = require('../blog/blogSchema.service');
const {
  planImages,
  rankImages,
  optimizeImageWithEngine,
  generateAiImageFallback,
  sanitizeErrorMessage
} = require('./generatorAdapter.service');

const UPLOADS_ROOT = path.join(__dirname, '../../../uploads');
const ARTICLE_UPLOADS_ROOT = path.join(UPLOADS_ROOT, 'articles');
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
const BOT_USER_AGENT = '1sLabsMedia/1.0 (+https://1slabs.my.id)';
const IMAGE_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const TRUSTED_STOCK_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'plus.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'pixabay.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'live.staticflickr.com',
  'farm1.staticflickr.com',
  'farm2.staticflickr.com',
  'farm3.staticflickr.com',
  'farm4.staticflickr.com',
  'farm5.staticflickr.com',
  'farm6.staticflickr.com',
  'api.openverse.org'
]);

const ALLOWED_WIKIMEDIA_LICENSE_RE = /^(cc0|public domain|pd|cc-by|cc by|cc-zero)/i;
const DISALLOWED_LICENSE_RE = /(nc|nd|non-?commercial|fair use|copyrighted|all rights reserved|restricted)/i;

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getProviderApiKeys() {
  return {
    unsplash: (process.env.UNSPLASH_ACCESS_KEY || '').trim(),
    pexels: (process.env.PEXELS_API_KEY || '').trim(),
    pixabay: (process.env.PIXABAY_API_KEY || '').trim(),
    openverse: (process.env.OPENVERSE_ACCESS_TOKEN || '').trim()
  };
}

/**
 * Returns non-sensitive provider configuration flags for the Admin UI.
 * Never exposes API keys or secrets.
 */
function getImageProvidersStatus(settings = null, engineGeminiConfigured = null) {
  const keys = getProviderApiKeys();
  const aiConfigured =
    engineGeminiConfigured !== null
      ? Boolean(engineGeminiConfigured)
      : Boolean((process.env.GEMINI_API || process.env.GEMINI_API_KEY || '').trim());

  const enabledSetting = settings ? Boolean(settings.enable_ai_image_fallback ?? true) : true;
  return {
    unsplash: { configured: Boolean(keys.unsplash), key_required: true, license: 'Unsplash License (Atribusi direkomendasikan)' },
    pexels: { configured: Boolean(keys.pexels), key_required: true, license: 'Pexels License (Atribusi direkomendasikan)' },
    pixabay: { configured: Boolean(keys.pixabay), key_required: true, license: 'Pixabay Content License' },
    openverse: { configured: true, authenticated: Boolean(keys.openverse), key_required: false, license: 'Creative Commons / Public Domain' },
    wikimedia: { configured: true, key_required: false, license: 'Wikimedia Commons CC0 / CC BY / Public Domain' },
    gemini_ai: { configured: aiConfigured && enabledSetting, available: aiConfigured, key_required: false, role: 'fallback_only' }
  };
}

/**
 * SSRF IP validation: rejects private, loopback, link-local, carrier-grade NAT, or multicast IPs.
 */
function isPrivateOrReservedIp(ip = '') {
  const raw = String(ip).trim().toLowerCase();
  if (!raw) return true;
  const clean = raw.startsWith('::ffff:') ? raw.slice(7) : raw;

  if (net.isIPv4(clean)) {
    const parts = clean.split('.').map((n) => parseInt(n, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(clean)) {
    if (clean === '::' || clean === '::1') return true;
    if (clean.startsWith('fc') || clean.startsWith('fd')) return true;
    if (/^fe[89ab]/i.test(clean)) return true;
    if (clean.startsWith('ff')) return true;
    return false;
  }

  return true;
}

/**
 * Validates that a remote image URL is safe against SSRF before fetching binary bytes.
 */
async function assertSafePublicHttpsUrl(rawUrl, { strictTrustedHosts = false } = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    throw new Error('URL gambar tidak valid.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Hanya protokol HTTPS yang diizinkan untuk unduhan gambar.');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    net.isIP(host) !== 0
  ) {
    throw new Error(`Hostname gambar tidak diizinkan (${host || 'unknown'}).`);
  }

  if (strictTrustedHosts && !TRUSTED_STOCK_IMAGE_HOSTS.has(host)) {
    throw new Error(`Domain gambar berada di luar allowlist provider tepercaya (${host}).`);
  }

  // Skip real DNS lookup in pure offline unit mocks if needed when lookup returns empty only if explicitly handled;
  // otherwise resolve DNS and reject internal IP addresses cleanly.
  const resolved = await dns.lookup(host, { all: true }).catch(() => []);
  if (!resolved || resolved.length === 0) {
    throw new Error(`Gagal melakukan resolusi DNS untuk host gambar (${host}).`);
  }
  for (const entry of resolved) {
    if (isPrivateOrReservedIp(entry.address)) {
      throw new Error(`SSRF Guard: Host gambar mengarah ke IP privat/internal (${entry.address}).`);
    }
  }

  return parsed;
}

function detectMagicImageFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { format: 'jpg', mime: 'image/jpeg' };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: 'png', mime: 'image/png' };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { format: 'webp', mime: 'image/webp' };
  }
  return null;
}

/**
 * Safely downloads an image binary with SSRF protection, manual redirect verification,
 * streaming size cap, magic-byte validation, and SHA-256 deduplication hash.
 */
async function downloadImageSafe(rawUrl, { timeoutMs = 18000, maxBytes = MAX_DOWNLOAD_BYTES, maxRedirects = 3 } = {}) {
  let currentUrl = String(rawUrl || '').trim();
  let response = null;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await assertSafePublicHttpsUrl(currentUrl);
    response = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': IMAGE_FETCH_USER_AGENT,
        Accept: 'image/webp,image/jpeg,image/png,image/*;q=0.8'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || hop === maxRedirects) {
        throw new Error(`Terlalu banyak pengalihan atau Location header kosong (${response.status}).`);
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    throw new Error(`Unduhan gambar gagal dengan HTTP ${response ? response.status : 'unknown'}.`);
  }

  const ctype = String(response.headers.get('content-type') || '').toLowerCase();
  if (ctype && !ctype.startsWith('image/')) {
    throw new Error(`Respons bukan konten gambar (${ctype.slice(0, 60)}).`);
  }

  const contentLen = Number(response.headers.get('content-length') || 0);
  if (contentLen > maxBytes) {
    throw new Error(`Ukuran gambar melebihi batas maksimum (${Math.round(contentLen / 1024 / 1024)}MB).`);
  }

  const arrBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrBuf);
  if (buffer.length > maxBytes || buffer.length < 512) {
    throw new Error('Ukuran file gambar tidak valid atau melebihi batas.');
  }

  const detected = detectMagicImageFormat(buffer);
  if (!detected) {
    throw new Error('Header file bukan format gambar yang diizinkan (JPG/PNG/WebP).');
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    buffer,
    format: detected.format,
    mimeType: detected.mime,
    sha256,
    sizeBytes: buffer.length
  };
}

function stripHtmlTags(raw = '') {
  return String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchUnsplash(queryText, perPage = 8) {
  const { unsplash } = getProviderApiKeys();
  if (!unsplash) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queryText)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${unsplash}`,
      'Accept-Version': 'v1',
      'User-Agent': BOT_USER_AGENT
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((p) => p?.urls?.regular || p?.urls?.full)
    .map((p) => {
      const creator = p.user?.name || p.user?.username || 'Unsplash Photographer';
      const creatorUrl = p.user?.links?.html ? `${p.user.links.html}?utm_source=1slabs_blog&utm_medium=referral` : null;
      return {
        provider: 'unsplash',
        provider_image_id: String(p.id || ''),
        original_url: p.urls.regular || p.urls.full,
        download_location: p.links?.download_location || null,
        thumb_url: p.urls.small || p.urls.thumb || p.urls.regular,
        title: String(p.description || p.alt_description || queryText).slice(0, 260),
        description: String(p.description || p.alt_description || '').slice(0, 400),
        alt: String(p.alt_description || p.description || '').slice(0, 240),
        tags: Array.isArray(p.tags) ? p.tags.map((t) => t?.title).filter(Boolean).join(', ') : '',
        photographer_name: String(creator).slice(0, 180),
        photographer_url: creatorUrl,
        source_page_url: p.links?.html ? `${p.links.html}?utm_source=1slabs_blog&utm_medium=referral` : null,
        license_name: 'Unsplash License',
        attribution_text: `Photo by ${creator} on Unsplash`,
        attribution_required: true,
        width: Number(p.width || 0),
        height: Number(p.height || 0)
      };
    });
}

async function triggerUnsplashDownload(downloadLocation) {
  const { unsplash } = getProviderApiKeys();
  if (!unsplash || !downloadLocation || !downloadLocation.startsWith('https://api.unsplash.com/')) return;
  fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${unsplash}`, 'Accept-Version': 'v1' },
    signal: AbortSignal.timeout(5000)
  }).catch(() => {});
}

async function searchPexels(queryText, perPage = 8) {
  const { pexels } = getProviderApiKeys();
  if (!pexels) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(queryText)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, {
    headers: {
      Authorization: pexels,
      'User-Agent': BOT_USER_AGENT
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const photos = Array.isArray(data?.photos) ? data.photos : [];
  return photos
    .filter((p) => p?.src?.large2x || p?.src?.large || p?.src?.original)
    .map((p) => {
      const creator = p.photographer || 'Pexels Creator';
      return {
        provider: 'pexels',
        provider_image_id: String(p.id || ''),
        original_url: p.src.large2x || p.src.large || p.src.original,
        thumb_url: p.src.medium || p.src.small || p.src.large,
        title: String(p.alt || queryText).slice(0, 260),
        description: String(p.alt || '').slice(0, 400),
        alt: String(p.alt || '').slice(0, 240),
        tags: '',
        photographer_name: String(creator).slice(0, 180),
        photographer_url: p.photographer_url || null,
        source_page_url: p.url || null,
        license_name: 'Pexels License',
        attribution_text: `Photo by ${creator} on Pexels`,
        attribution_required: true,
        width: Number(p.width || 0),
        height: Number(p.height || 0)
      };
    });
}

async function searchPixabay(queryText, perPage = 8) {
  const { pixabay } = getProviderApiKeys();
  if (!pixabay) return [];
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(pixabay)}&q=${encodeURIComponent(queryText)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${perPage}&min_width=800`;
  const res = await fetch(url, {
    headers: { 'User-Agent': BOT_USER_AGENT },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const hits = Array.isArray(data?.hits) ? data.hits : [];
  return hits
    .filter((h) => h?.largeImageURL || h?.webformatURL)
    .map((h) => {
      const creator = h.user || 'Pixabay Contributor';
      return {
        provider: 'pixabay',
        provider_image_id: String(h.id || ''),
        original_url: h.largeImageURL || h.webformatURL,
        thumb_url: h.previewURL || h.webformatURL || h.largeImageURL,
        title: String(h.tags || queryText).slice(0, 260),
        description: String(h.tags || '').slice(0, 400),
        alt: String(h.tags || '').slice(0, 240),
        tags: String(h.tags || ''),
        photographer_name: String(creator).slice(0, 180),
        photographer_url: h.user_id ? `https://pixabay.com/users/${h.user}-${h.user_id}/` : null,
        source_page_url: h.pageURL || null,
        license_name: 'Pixabay Content License',
        attribution_text: `Image by ${creator} from Pixabay`,
        attribution_required: false,
        width: Number(h.imageWidth || h.webformatWidth || 0),
        height: Number(h.imageHeight || h.webformatHeight || 0)
      };
    });
}

async function searchOpenverse(queryText, perPage = 10) {
  const { openverse } = getProviderApiKeys();
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(queryText)}&license_type=commercial&page_size=${perPage}`;
  const headers = {
    'User-Agent': BOT_USER_AGENT,
    Accept: 'application/json'
  };
  if (openverse) {
    headers.Authorization = `Bearer ${openverse}`;
  }
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return [];
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((r) => {
      const srcUrl = String(r?.url || '');
      const lic = String(r?.license || '').toLowerCase();
      const ft = String(r?.filetype || '').toLowerCase();
      if (ft && !['jpg', 'jpeg', 'png', 'webp'].includes(ft)) return false;
      return srcUrl.startsWith('https://') && !DISALLOWED_LICENSE_RE.test(lic);
    })
    .map((r) => {
      const creator = r.creator || 'Openverse Contributor';
      const licLabel = r.license
        ? `${String(r.license).toUpperCase()} ${r.license_version || ''}`.trim()
        : 'Creative Commons';
      const attrReq = !['cc0', 'pdm'].includes(String(r.license || '').toLowerCase());
      const tagList = Array.isArray(r.tags) ? r.tags.map((t) => t?.name).filter(Boolean).join(', ') : '';
      return {
        provider: 'openverse',
        provider_image_id: String(r.id || ''),
        original_url: r.url,
        thumb_url: r.thumbnail || r.url,
        title: String(r.title || queryText).slice(0, 260),
        description: String(r.title || tagList || '').slice(0, 400),
        alt: String(r.title || '').slice(0, 240),
        tags: tagList,
        photographer_name: String(creator).slice(0, 180),
        photographer_url: r.creator_url || null,
        source_page_url: r.foreign_landing_url || null,
        license_name: licLabel,
        attribution_text: `${creator} (${licLabel}) via Openverse`,
        attribution_required: attrReq,
        width: Number(r.width || 0),
        height: Number(r.height || 0)
      };
    });
}

async function searchWikimedia(queryText, perPage = 12) {
  const fetchLimit = Math.min(20, Math.max(8, perPage * 2));
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    `${queryText} filetype:bitmap`
  )}&gsrnamespace=6&gsrlimit=${fetchLimit}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': BOT_USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const queryWords = String(queryText || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  const out = [];

  for (const p of pages) {
    const info = Array.isArray(p?.imageinfo) ? p.imageinfo[0] : null;
    if (!info || !info.url || !String(info.url).startsWith('https://')) continue;
    const mime = String(info.mime || '').toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) continue;
    const w = Number(info.width || 0);
    const h = Number(info.height || 0);
    if (w < 680 || h < 360) continue;

    const cleanTitle = String(p.title || '').replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
    if (/^(EFTA\d+|scan\d+|img\s*\d+|dsc\s*\d+)$/i.test(cleanTitle.split(/\s+/)[0] || '')) {
      continue;
    }

    const meta = info.extmetadata || {};
    const licShort = stripHtmlTags(meta.LicenseShortName?.value || '');
    if (!licShort || DISALLOWED_LICENSE_RE.test(licShort) || !ALLOWED_WIKIMEDIA_LICENSE_RE.test(licShort)) {
      continue;
    }

    const artist = stripHtmlTags(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Contributor').slice(0, 160);
    const desc = stripHtmlTags(meta.ImageDescription?.value || p.title || '').slice(0, 350);
    const attrReq = !/^(cc0|public domain|pd)/i.test(licShort);
    const haystack = `${cleanTitle} ${desc}`.toLowerCase();
    const matchCount = queryWords.filter((kw) => haystack.includes(kw)).length;
    if (queryWords.length >= 2 && matchCount === 0) continue;

    out.push({
      provider: 'wikimedia',
      provider_image_id: String(p.pageid || cleanTitle),
      original_url: info.url,
      thumb_url: info.url,
      title: cleanTitle.slice(0, 260),
      description: desc || cleanTitle,
      alt: (desc || cleanTitle).slice(0, 220),
      tags: cleanTitle,
      photographer_name: artist || 'Wikimedia Commons Contributor',
      photographer_url: info.descriptionurl || null,
      source_page_url: info.descriptionurl || null,
      license_name: licShort.slice(0, 120),
      attribution_text: `${artist || 'Wikimedia Contributor'} (${licShort}) via Wikimedia Commons`,
      attribution_required: attrReq,
      width: w,
      height: h,
      _kw_hits: matchCount
    });
  }

  out.sort((a, b) => (b._kw_hits || 0) - (a._kw_hits || 0));
  return out.slice(0, perPage);
}

const PROVIDER_SEARCH_FN = {
  unsplash: searchUnsplash,
  pexels: searchPexels,
  pixabay: searchPixabay,
  openverse: searchOpenverse,
  wikimedia: searchWikimedia
};

function buildProvidersOrder(settings = {}) {
  const keys = getProviderApiKeys();
  const primary = String(settings.image_primary_provider || 'auto').toLowerCase();
  const fallback = String(settings.image_fallback_provider || 'wikimedia').toLowerCase();

  const available = [
    keys.unsplash ? 'unsplash' : null,
    keys.pexels ? 'pexels' : null,
    keys.pixabay ? 'pixabay' : null,
    'openverse',
    'wikimedia'
  ].filter(Boolean);

  const ordered = [];
  const pushIfAvailable = (name) => {
    if (name && name !== 'auto' && name !== 'none' && PROVIDER_SEARCH_FN[name] && !ordered.includes(name)) {
      if ((name === 'unsplash' && !keys.unsplash) || (name === 'pexels' && !keys.pexels) || (name === 'pixabay' && !keys.pixabay)) {
        return;
      }
      ordered.push(name);
    }
  };

  pushIfAvailable(primary);
  for (const name of available) {
    if (name !== fallback) pushIfAvailable(name);
  }
  pushIfAvailable(fallback);
  return ordered;
}

function compactStockQueryWords(rawQuery = '', maxWords = 2) {
  const stop = new Set([
    'a', 'an', 'and', 'at', 'analyzing', 'building', 'checking', 'clean', 'configuring',
    'creating', 'depicting', 'for', 'illustrating', 'in', 'managing', 'modern', 'of',
    'on', 'or', 'people', 'person', 'professional', 'professionals', 'reviewing',
    'showing', 'the', 'to', 'using', 'with', 'working'
  ]);
  const tokens = String(rawQuery || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const core = tokens.filter((w) => !stop.has(w));
  return (core.length >= 2 ? core : tokens).slice(0, maxWords).join(' ').trim();
}

/**
 * Searches configured legal stock providers for a visual query without duplicates.
 * Automatically retries compacted 2-word keyword subsets when verbose phrases yield zero hits.
 */
async function searchStockImages({ queryText, providersOrder, usedUrls = [], perProviderLimit = 6 }) {
  const q = String(queryText || '').trim();
  if (!q) return [];
  const excludeSet = new Set((usedUrls || []).map((u) => String(u).trim().toLowerCase()));
  const order = Array.isArray(providersOrder) && providersOrder.length > 0 ? providersOrder : buildProvidersOrder();

  const queriesToTry = [q];
  const compacted2 = compactStockQueryWords(q, 2);
  if (compacted2 && compacted2 !== q.toLowerCase()) {
    queriesToTry.push(compacted2);
  }
  const compactedTail2 = q.split(/\s+/).filter((w) => w.length >= 3).slice(-2).join(' ').trim();
  if (compactedTail2 && !queriesToTry.some((x) => x.toLowerCase() === compactedTail2.toLowerCase())) {
    queriesToTry.push(compactedTail2);
  }

  const all = [];
  const seenUrl = new Set();

  for (const activeQuery of queriesToTry) {
    for (const provider of order) {
      const fn = PROVIDER_SEARCH_FN[provider];
      if (!fn) continue;
      try {
        const items = await fn(activeQuery, perProviderLimit);
        for (const item of items) {
          const key = String(item.original_url || '').trim().toLowerCase();
          if (!key || excludeSet.has(key) || seenUrl.has(key)) continue;
          seenUrl.add(key);
          all.push(item);
        }
        if (all.length >= 8) break;
      } catch {
        // Keep provider fault isolated
      }
    }
    if (all.length >= 2) break;
  }
  return all;
}

function buildLocalArticleImagePath({ scopeType = 'item', scopeId, role, index = 0, slugHint = 'article', hashHex = '', ext = 'webp' }) {
  const folderKey = scopeType === 'article' ? String(scopeId) : `item-${scopeId}`;
  const roleFolder = role === 'featured' ? 'featured' : 'inline';
  const dir = path.join(ARTICLE_UPLOADS_ROOT, folderKey, roleFolder);
  fs.mkdirSync(dir, { recursive: true });

  const safeSlug = slugify(slugHint || '1slabs-article').slice(0, 48) || 'article';
  const shortHash = String(hashHex || crypto.randomBytes(4).toString('hex')).slice(0, 8);
  const safeExt = ['webp', 'jpg', 'jpeg', 'png'].includes(String(ext).toLowerCase()) ? String(ext).toLowerCase() : 'webp';
  const filename = `${safeSlug}-${role}-${index}-${shortHash}.${safeExt}`;
  const fullPath = path.join(dir, filename);
  const publicUrl = `/uploads/articles/${folderKey}/${roleFolder}/${filename}`;
  return { dir, filename, fullPath, publicUrl };
}

/**
 * Resolves a local `/uploads/...` path on disk safely (prevents directory traversal).
 */
function resolveLocalUploadPath(publicUrl = '') {
  const clean = String(publicUrl || '').trim().split('?')[0];
  if (!clean.startsWith('/uploads/')) return null;
  const rel = clean.slice('/uploads/'.length).replace(/\\/g, '/');
  if (!rel || rel.includes('..') || rel.startsWith('/')) return null;
  const resolved = path.resolve(UPLOADS_ROOT, rel);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) return null;
  return resolved;
}

function doesLocalUploadExist(publicUrl = '') {
  const full = resolveLocalUploadPath(publicUrl);
  if (!full) return false;
  try {
    const stat = fs.statSync(full);
    return stat.isFile() && stat.size > 256;
  } catch {
    return false;
  }
}

/**
 * Strips previously AI-inserted inline figures and injects TipTap FigureImageExtension-compatible
 * `<figure>` blocks proportionally into H2 sections without breaking lists/tables/CTAs.
 */
function insertInlineFiguresInHtml(html = '', inlineImages = [], { placement = 'after_h2_balanced' } = {}) {
  if (!html || typeof html !== 'string') return '';

  // Remove previous auto-inserted figures cleanly for idempotent re-discoveries/swaps
  let working = html.replace(/<figure\b[^>]*data-ai-inline=["']1["'][^>]*>[\s\S]*?<\/figure>/gi, '').trim();
  const validImages = (inlineImages || []).filter((img) => img && (img.local_url || img.original_url));
  if (validImages.length === 0) return working;

  const escAttr = (val = '') =>
    String(val)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const escHtml = (val = '') =>
    String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const buildFigureHtml = (img) => {
    const src = escAttr(img.local_url || img.original_url);
    const alt = escAttr(img.alt_text || img.placement_section || 'Ilustrasi pembahasan');
    const caption = escHtml(img.caption || img.alt_text || '');
    return [
      `<figure data-type="figure-image" data-ai-inline="1" style="max-width: 100%; margin: 1.5rem auto; text-align: center;">`,
      `<img src="${src}" alt="${alt}" style="width: 100%; height: auto; border-radius: 12px;" loading="lazy" />`,
      caption
        ? `<figcaption style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">${caption}</figcaption>`
        : '',
      `</figure>`
    ]
      .filter(Boolean)
      .join('');
  };

  // Mask CTA / table / list blocks so we never inject inside structured blocks
  const masked = [];
  working = working.replace(
    /<div\b[^>]*class=["'][^"']*oneslabs-cta-block[^"']*["'][^>]*>[\s\S]*?<\/div>|<table\b[^>]*>[\s\S]*?<\/table>|<ul\b[^>]*>[\s\S]*?<\/ul>|<ol\b[^>]*>[\s\S]*?<\/ol>/gi,
    (block) => {
      const tok = `__ONESLABS_IMG_MASK_${masked.length}__`;
      masked.push(block);
      return tok;
    }
  );

  // Locate H2 headings
  const h2Matches = [...working.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const insertions = [];

  for (const img of validImages) {
    const figureHtml = buildFigureHtml(img);
    const secName = String(img.placement_section || '').trim().toLowerCase();
    let anchorStart = -1;

    if (secName) {
      const matchedH2 = h2Matches.find((m) => stripHtmlTags(m[1]).toLowerCase() === secName);
      if (matchedH2) {
        anchorStart = matchedH2.index + matchedH2[0].length;
      }
    }

    if (anchorStart < 0 && h2Matches.length > 0) {
      const fallbackIdx = Math.min(h2Matches.length - 1, Math.max(0, Number(img.placement_index || 0)));
      anchorStart = h2Matches[fallbackIdx].index + h2Matches[fallbackIdx][0].length;
    }

    let insertAt = -1;
    if (anchorStart >= 0 && placement !== 'end_fallback') {
      const tail = working.slice(anchorStart);
      const nextPClose = tail.search(/<\/p>/i);
      const nextH2 = tail.search(/<h2\b/i);
      if (nextPClose >= 0 && (nextH2 < 0 || nextPClose < nextH2)) {
        insertAt = anchorStart + nextPClose + 4;
      } else {
        insertAt = anchorStart;
      }
    } else {
      const allPs = [...working.matchAll(/<\/p>/gi)];
      if (allPs.length > 0) {
        const pick = allPs[Math.min(allPs.length - 1, Math.max(0, Number(img.placement_index || 0) * 2 + 1))];
        insertAt = pick.index + 4;
      }
    }

    if (insertAt >= 0) {
      insertions.push({ pos: insertAt, html: `\n${figureHtml}\n` });
    }
  }

  insertions.sort((a, b) => b.pos - a.pos);
  for (const ins of insertions) {
    working = `${working.slice(0, ins.pos)}${ins.html}${working.slice(ins.pos)}`;
  }

  masked.forEach((block, idx) => {
    working = working.replace(`__ONESLABS_IMG_MASK_${idx}__`, block);
  });

  return working.trim();
}

async function processCandidateDownloadAndSave({
  candidate,
  scopeType = 'item',
  scopeId,
  role,
  placementIndex = 0,
  slugHint = 'article',
  settings = {},
  usedHashes = new Set()
}) {
  const autoDownload = Number(settings.auto_download_images ?? 1) === 1;
  const autoOptimize = Number(settings.auto_optimize_images ?? 1) === 1;
  const preferredFormat = ['webp', 'jpg', 'jpeg'].includes(String(settings.preferred_image_format || 'webp').toLowerCase())
    ? String(settings.preferred_image_format || 'webp').toLowerCase()
    : 'webp';

  if (!autoDownload) {
    return {
      status: 'external_fallback',
      local_url: null,
      file_path: null,
      sha256_hash: null,
      width: Number(candidate.width || 0),
      height: Number(candidate.height || 0),
      file_format: 'external',
      file_size_bytes: 0
    };
  }

  let downloaded;
  try {
    downloaded = await downloadImageSafe(candidate.original_url);
  } catch (primaryErr) {
    const altThumb = String(candidate.thumb_url || '').trim();
    if (altThumb && altThumb !== candidate.original_url && altThumb.startsWith('https://')) {
      downloaded = await downloadImageSafe(altThumb);
    } else {
      throw primaryErr;
    }
  }
  if (usedHashes.has(downloaded.sha256)) {
    throw new Error('Gambar duplikat berdasarkan hash SHA-256 di artikel yang sama.');
  }

  let finalBuffer = downloaded.buffer;
  let finalFormat = downloaded.format;
  let finalWidth = Number(candidate.width || 0);
  let finalHeight = Number(candidate.height || 0);

  if (autoOptimize) {
    try {
      const opt = await optimizeImageWithEngine(
        {
          image_base64: downloaded.buffer.toString('base64'),
          preferred_format: preferredFormat === 'jpeg' ? 'jpeg' : preferredFormat,
          max_width: role === 'featured' ? 1440 : 1200,
          min_accept_width: 380,
          crop_aspect: role === 'featured',
          target_aspect: settings.preferred_image_aspect || '16:9'
        },
        settings.engine_url
      );
      if (opt?.success && opt.base64_data) {
        finalBuffer = Buffer.from(opt.base64_data, 'base64');
        finalFormat = opt.format || preferredFormat;
        finalWidth = Number(opt.width || finalWidth);
        finalHeight = Number(opt.height || finalHeight);
      }
    } catch (optErr) {
      // Allow keeping original valid binary if optimization endpoint temporarily unreachable, unless explicitly tiny/corrupt
      if (/422|terlalu kecil|korup/i.test(optErr.message)) {
        throw optErr;
      }
    }
  }

  const finalHash = crypto.createHash('sha256').update(finalBuffer).digest('hex');
  if (usedHashes.has(finalHash)) {
    throw new Error('Gambar teroptimasi duplikat di artikel ini.');
  }
  usedHashes.add(downloaded.sha256);
  usedHashes.add(finalHash);

  const dest = buildLocalArticleImagePath({
    scopeType,
    scopeId,
    role,
    index: placementIndex,
    slugHint,
    hashHex: finalHash,
    ext: finalFormat
  });

  fs.writeFileSync(dest.fullPath, finalBuffer);
  if (candidate.provider === 'unsplash' && candidate.download_location) {
    await triggerUnsplashDownload(candidate.download_location);
  }

  return {
    status: 'local',
    local_url: dest.publicUrl,
    file_path: dest.fullPath,
    sha256_hash: finalHash,
    width: finalWidth,
    height: finalHeight,
    file_format: finalFormat,
    file_size_bytes: finalBuffer.length
  };
}

/**
 * Orchestrates full AI visual discovery, provider search, ranking, SSRF-safe download,
 * WebP optimization, metadata DB persistence, and HTML injection for a queue item.
 */
async function discoverAndAttachImagesForItem(item, settings = {}, options = {}) {
  if (Number(settings.enable_auto_images ?? 1) === 0 && !options.force) {
    return {
      skipped: true,
      featured: null,
      inline: [],
      records: [],
      updatedHtml: item.draft_content || ''
    };
  }

  const itemId = item.id;
  const title = item.draft_title || item.title || item.topic || 'Artikel 1sLabs';
  const slugHint = item.draft_slug || slugify(title);
  const rawHtml = item.draft_content || item.content || '';
  const providersOrder = buildProvidersOrder(settings);
  const enableAiFallback = Number(settings.enable_ai_image_fallback ?? 1) === 1;
  const maxImages = Math.max(1, Math.min(6, Number(settings.max_images_per_article ?? 4)));
  const minWidth = Math.max(360, Number(settings.min_image_width ?? 800));
  const minHeight = Math.max(240, Number(settings.min_image_height ?? 450));
  const preferredFormat = String(settings.preferred_image_format || 'webp').toLowerCase();

  let plan = null;
  try {
    plan = await planImages(
      {
        title,
        target_keyword: item.draft_focus_keyphrase || item.target_keyword || title,
        target_audience: item.target_audience || '',
        content: rawHtml,
        pillar: options.pillar || {},
        pillar_code: item.pillar_code || '',
        language: item.language || settings.default_language || 'id',
        max_images_per_article: maxImages,
        featured_image_recommendation: item.featured_image_recommendation || '',
        featured_image_alt: item.featured_image_alt || ''
      },
      settings.engine_url
    );
  } catch {
    plan = {
      visual_theme: `Visual editorial ${title}`,
      model_used: 'fallback',
      featured: {
        role: 'featured',
        search_query: 'software developer laptop',
        secondary_query: 'technology office',
        alt_text: `Ilustrasi utama ${title.slice(0, 120)}`,
        caption: `Visual pendukung artikel ${title.slice(0, 140)}`,
        ai_prompt: `Clean modern technology workspace illustrating ${title}, no text, no watermark`
      },
      inline: []
    };
  }

  await query('UPDATE content_generation_items SET image_plan_json = ? WHERE id = ?', [
    JSON.stringify(plan),
    itemId
  ]).catch(() => {});

  const usedUrls = new Set();
  const usedHashes = new Set();
  const records = [];
  const slots = [];
  if (plan.featured) slots.push({ ...plan.featured, role: 'featured', placement_index: 0 });
  if (Array.isArray(plan.inline)) {
    plan.inline.slice(0, Math.max(0, maxImages - 1)).forEach((slot, idx) => {
      slots.push({ ...slot, role: 'inline', placement_index: idx + 1 });
    });
  }

  const broadPool = ['software developer laptop', 'server rack datacenter', 'office team meeting', 'web design laptop'];
  const getBroadFallback = (placementIdx = 0) => {
    const pCode = String(item.pillar_code || '').toLowerCase();
    if (/hosting|domain|infrastructure|cloud/.test(pCode)) {
      return placementIdx === 0 ? 'server rack datacenter' : 'software developer laptop';
    }
    if (/consulting|transformation|business/.test(pCode)) {
      return placementIdx === 0 ? 'office team meeting' : 'business laptop desk';
    }
    return broadPool[placementIdx % broadPool.length];
  };

  for (const slot of slots) {
    let selectedCandidate = null;
    let savedFile = null;
    let lastError = null;
    const broadFallback = getBroadFallback(slot.placement_index || 0);
    const queryAttempts = [slot.search_query, slot.secondary_query, broadFallback]
      .map((q) => String(q || '').trim())
      .filter((q, idx, arr) => Boolean(q) && arr.indexOf(q) === idx);

    for (const qText of queryAttempts) {
      if (savedFile) break;
      const rawCandidates = await searchStockImages({
        queryText: qText,
        providersOrder,
        usedUrls: [...usedUrls],
        perProviderLimit: 6
      });

      if (rawCandidates.length === 0) continue;

      let rankedPool = rawCandidates;
      try {
        const rankedRes = await rankImages(
          {
            title,
            requirement: slot,
            candidates: rawCandidates,
            used_urls: [...usedUrls],
            min_width: minWidth,
            min_height: minHeight,
            preferred_aspect: settings.preferred_image_aspect || '16:9',
            use_llm_rerank: rawCandidates.length >= 2
          },
          settings.engine_url
        );
        if (Array.isArray(rankedRes?.ranked) && rankedRes.ranked.length > 0) {
          rankedPool = rankedRes.selected
            ? [rankedRes.selected, ...rankedRes.ranked.filter((r) => r.original_url !== rankedRes.selected.original_url)]
            : rankedRes.ranked;
        }
      } catch {
        // Proceed cleanly with deterministic stock candidate order
      }

      // Try up to top 3 ranked candidates in case one remote CDN blocks hotlinking or fails MIME verification
      for (const cand of rankedPool.slice(0, 3)) {
        const candUrl = String(cand.original_url || '').trim();
        if (!candUrl || usedUrls.has(candUrl.toLowerCase())) continue;
        try {
          const processed = await processCandidateDownloadAndSave({
            candidate: cand,
            scopeType: 'item',
            scopeId: itemId,
            role: slot.role,
            placementIndex: slot.placement_index,
            slugHint,
            settings,
            usedHashes
          });
          selectedCandidate = cand;
          savedFile = processed;
          usedUrls.add(candUrl.toLowerCase());
          break;
        } catch (dlErr) {
          lastError = dlErr.message;
        }
      }
    }

    // Optional AI Image Fallback ONLY when stock providers returned no usable/downloadable image
    if (!savedFile && enableAiFallback && slot.ai_prompt) {
      try {
        const aiRes = await generateAiImageFallback(
          {
            prompt: slot.ai_prompt,
            preferred_format: preferredFormat === 'jpeg' ? 'jpeg' : preferredFormat,
            max_width: slot.role === 'featured' ? 1280 : 1080,
            crop_aspect: slot.role === 'featured'
          },
          settings.engine_url
        );
        if (aiRes?.base64_data) {
          const buf = Buffer.from(aiRes.base64_data, 'base64');
          const hashHex = crypto.createHash('sha256').update(buf).digest('hex');
          const dest = buildLocalArticleImagePath({
            scopeType: 'item',
            scopeId: itemId,
            role: slot.role,
            index: slot.placement_index,
            slugHint,
            hashHex,
            ext: aiRes.format || 'webp'
          });
          fs.writeFileSync(dest.fullPath, buf);
          usedHashes.add(hashHex);
          selectedCandidate = {
            provider: 'gemini_ai',
            provider_image_id: hashHex.slice(0, 16),
            original_url: dest.publicUrl,
            title: slot.subject || title,
            description: slot.caption || slot.alt_text,
            photographer_name: 'AI Visual Engine (1sLabs / Gemini)',
            photographer_url: null,
            source_page_url: null,
            license_name: `AI Generated (${aiRes.model_used || 'Gemini Image'})`,
            attribution_text: '',
            attribution_required: false,
            relevance_score: 82
          };
          savedFile = {
            status: 'local',
            local_url: dest.publicUrl,
            file_path: dest.fullPath,
            sha256_hash: hashHex,
            width: Number(aiRes.width || 1280),
            height: Number(aiRes.height || 720),
            file_format: aiRes.format || 'webp',
            file_size_bytes: buf.length
          };
        }
      } catch (aiErr) {
        lastError = lastError ? `${lastError}; AI Fallback: ${aiErr.message}` : aiErr.message;
      }
    }

    if (selectedCandidate && savedFile) {
      const autoAltCap = Number(settings.auto_image_alt_caption ?? 1) === 1;
      const finalAlt = (autoAltCap && slot.alt_text ? slot.alt_text : selectedCandidate.alt || slot.alt_text || title).slice(0, 290);
      const finalCap = (autoAltCap && slot.caption ? slot.caption : selectedCandidate.description || slot.caption || '').slice(0, 480);

      records.push({
        generation_item_id: itemId,
        article_id: item.published_article_id || null,
        role: slot.role,
        provider: selectedCandidate.provider,
        provider_image_id: String(selectedCandidate.provider_image_id || '').slice(0, 180),
        original_url: String(selectedCandidate.original_url).slice(0, 990),
        local_url: savedFile.local_url,
        file_path: savedFile.file_path,
        sha256_hash: savedFile.sha256_hash,
        search_query: String(slot.search_query || '').slice(0, 280),
        title: String(selectedCandidate.title || title).slice(0, 280),
        alt_text: finalAlt,
        caption: finalCap,
        description: String(selectedCandidate.description || '').slice(0, 800),
        photographer_name: selectedCandidate.photographer_name || null,
        photographer_url: selectedCandidate.photographer_url || null,
        source_page_url: selectedCandidate.source_page_url || null,
        license_name: selectedCandidate.license_name || null,
        attribution_text: selectedCandidate.attribution_text || null,
        attribution_required: selectedCandidate.attribution_required ? 1 : 0,
        width: Number(savedFile.width || selectedCandidate.width || 0),
        height: Number(savedFile.height || selectedCandidate.height || 0),
        file_format: savedFile.file_format || 'webp',
        file_size_bytes: Number(savedFile.file_size_bytes || 0),
        placement_section: slot.section_heading ? String(slot.section_heading).slice(0, 240) : null,
        placement_index: Number(slot.placement_index || 0),
        relevance_score: Number(selectedCandidate.relevance_score || 80),
        status: savedFile.status,
        is_selected: 1,
        error_detail: lastError ? sanitizeErrorMessage(lastError).slice(0, 480) : null
      });
    } else if (lastError) {
      // Log non-selected failure trace cleanly for diagnostics without blocking healthy slots
      records.push({
        generation_item_id: itemId,
        article_id: item.published_article_id || null,
        role: slot.role,
        provider: providersOrder[0] || 'openverse',
        provider_image_id: null,
        original_url: `failed://slot-${slot.placement_index}`,
        local_url: null,
        file_path: null,
        sha256_hash: null,
        search_query: String(slot.search_query || '').slice(0, 280),
        title: slot.subject || slot.section_heading || title,
        alt_text: slot.alt_text || '',
        caption: slot.caption || '',
        description: '',
        photographer_name: null,
        photographer_url: null,
        source_page_url: null,
        license_name: null,
        attribution_text: null,
        attribution_required: 0,
        width: 0,
        height: 0,
        file_format: null,
        file_size_bytes: 0,
        placement_section: slot.section_heading ? String(slot.section_heading).slice(0, 240) : null,
        placement_index: Number(slot.placement_index || 0),
        relevance_score: 0,
        status: 'failed',
        is_selected: 0,
        error_detail: sanitizeErrorMessage(lastError).slice(0, 480)
      });
    }
  }

  // Replace previous selected DB records for this item cleanly
  await query('DELETE FROM article_images WHERE generation_item_id = ?', [itemId]);
  for (const rec of records) {
    await query(
      `INSERT INTO article_images
       (generation_item_id, article_id, role, provider, provider_image_id, original_url, local_url, file_path,
        sha256_hash, search_query, title, alt_text, caption, description, photographer_name, photographer_url,
        source_page_url, license_name, attribution_text, attribution_required, width, height, file_format,
        file_size_bytes, placement_section, placement_index, relevance_score, status, is_selected, error_detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.generation_item_id,
        rec.article_id,
        rec.role,
        rec.provider,
        rec.provider_image_id,
        rec.original_url,
        rec.local_url,
        rec.file_path,
        rec.sha256_hash,
        rec.search_query,
        rec.title,
        rec.alt_text,
        rec.caption,
        rec.description,
        rec.photographer_name,
        rec.photographer_url,
        rec.source_page_url,
        rec.license_name,
        rec.attribution_text,
        rec.attribution_required,
        rec.width,
        rec.height,
        rec.file_format,
        rec.file_size_bytes,
        rec.placement_section,
        rec.placement_index,
        rec.relevance_score,
        rec.status,
        rec.is_selected,
        rec.error_detail
      ]
    );
  }

  const selectedRecords = records.filter((r) => r.is_selected === 1 && r.status !== 'failed');
  const featured = selectedRecords.find((r) => r.role === 'featured') || null;
  const inlineList = selectedRecords.filter((r) => r.role === 'inline');

  const updatedHtml = insertInlineFiguresInHtml(rawHtml, inlineList, {
    placement: settings.inline_image_placement || 'after_h2_balanced'
  });

  const featuredUrl = featured ? featured.local_url || featured.original_url : item.draft_featured_image || null;
  const featuredAlt = featured ? featured.alt_text : item.featured_image_alt || null;
  const featuredCaption = featured ? featured.caption : item.draft_featured_image_caption || null;

  await query(
    `UPDATE content_generation_items
     SET draft_featured_image = ?,
         featured_image_alt = COALESCE(NULLIF(?, ''), featured_image_alt),
         draft_featured_image_caption = ?,
         draft_content = ?
     WHERE id = ?`,
    [featuredUrl, featuredAlt || '', featuredCaption, updatedHtml, itemId]
  );

  return {
    skipped: false,
    plan,
    featured,
    inline: inlineList,
    records,
    updatedHtml
  };
}

/**
 * Fetches selected + candidate DB images for a generation item or blog article.
 */
async function getImagesForItemOrArticle({ generationItemId = null, articleId = null } = {}) {
  if (generationItemId) {
    return query(
      `SELECT * FROM article_images
       WHERE generation_item_id = ?
       ORDER BY FIELD(role, 'featured', 'inline', 'backup'), placement_index ASC, id ASC`,
      [generationItemId]
    );
  }
  if (articleId) {
    return query(
      `SELECT * FROM article_images
       WHERE article_id = ?
       ORDER BY FIELD(role, 'featured', 'inline', 'backup'), placement_index ASC, id ASC`,
      [articleId]
    );
  }
  return [];
}

/**
 * Builds public attribution records for `blog_articles.image_attribution_json`.
 */
function buildAttributionList(imageRows = []) {
  return (imageRows || [])
    .filter((img) => img && img.is_selected !== 0 && img.status !== 'failed')
    .map((img) => ({
      role: img.role,
      provider: img.provider,
      photographer_name: img.photographer_name || null,
      photographer_url: img.photographer_url || null,
      source_page_url: img.source_page_url || null,
      license_name: img.license_name || null,
      attribution_text: img.attribution_text || null,
      attribution_required: Boolean(img.attribution_required)
    }))
    .filter((a) => a.attribution_text || a.photographer_name || a.license_name);
}

/**
 * Copies/organizes draft item images into `uploads/articles/{article_id}/{featured|inline}/`
 * during publishing so live blog paths match canonical article folder structure, and
 * rewrites URLs cleanly in HTML, featured_image, and `article_images`.
 */
async function syncItemImagesToArticleStorage(itemId, articleId, { featuredImage = null, content = '' } = {}) {
  const rows = itemId
    ? await query('SELECT * FROM article_images WHERE generation_item_id = ? AND is_selected = 1 AND status != ?', [
        itemId,
        'failed'
      ])
    : [];

  let nextFeatured = featuredImage;
  let nextContent = content;

  for (const row of rows) {
    let nextLocalUrl = row.local_url;
    let nextFilePath = row.file_path;

    if (row.local_url && row.local_url.includes(`/uploads/articles/item-${itemId}/`)) {
      const srcPath = resolveLocalUploadPath(row.local_url);
      if (srcPath && fs.existsSync(srcPath)) {
        const roleDir = row.role === 'featured' ? 'featured' : 'inline';
        const targetDir = path.join(ARTICLE_UPLOADS_ROOT, String(articleId), roleDir);
        fs.mkdirSync(targetDir, { recursive: true });
        const filename = path.basename(srcPath);
        const destPath = path.join(targetDir, filename);
        if (srcPath !== destPath) {
          fs.copyFileSync(srcPath, destPath);
        }
        nextFilePath = destPath;
        nextLocalUrl = `/uploads/articles/${articleId}/${roleDir}/${filename}`;

        if (nextFeatured === row.local_url) {
          nextFeatured = nextLocalUrl;
        }
        if (nextContent && nextContent.includes(row.local_url)) {
          nextContent = nextContent.split(row.local_url).join(nextLocalUrl);
        }
      }
    }

    await query(
      `UPDATE article_images SET article_id = ?, local_url = ?, file_path = ? WHERE id = ?`,
      [articleId, nextLocalUrl, nextFilePath, row.id]
    );
  }

  // Catch any leftover direct item folder references cleanly
  const itemPrefix = `/uploads/articles/item-${itemId}/`;
  const artPrefix = `/uploads/articles/${articleId}/`;
  if (nextFeatured && nextFeatured.includes(itemPrefix)) {
    nextFeatured = nextFeatured.split(itemPrefix).join(artPrefix);
  }
  if (nextContent && nextContent.includes(itemPrefix)) {
    nextContent = nextContent.split(itemPrefix).join(artPrefix);
  }

  return {
    featuredImage: nextFeatured,
    content: nextContent,
    attributions: buildAttributionList(rows)
  };
}

/**
 * Replaces a specific featured or inline image on a draft item using either:
 * - an existing local `/uploads/...` URL (e.g. from MediaLibraryModal)
 * - a selected legal stock candidate (downloaded & optimized SSRF-safely)
 * - updated alt_text / caption metadata.
 */
async function replaceItemImageSlot(item, payload = {}, settings = {}) {
  const role = payload.role === 'inline' ? 'inline' : 'featured';
  const placementIndex = Number(payload.placement_index || 0);
  const slugHint = item.draft_slug || slugify(item.draft_title || item.topic || 'artikel');
  const existingRows = await getImagesForItemOrArticle({ generationItemId: item.id });

  let newRecord = null;

  if (payload.candidate && payload.candidate.original_url) {
    const usedHashes = new Set(existingRows.map((r) => r.sha256_hash).filter(Boolean));
    const savedFile = await processCandidateDownloadAndSave({
      candidate: payload.candidate,
      scopeType: 'item',
      scopeId: item.id,
      role,
      placementIndex,
      slugHint,
      settings,
      usedHashes
    });
    newRecord = {
      generation_item_id: item.id,
      article_id: item.published_article_id || null,
      role,
      provider: payload.candidate.provider || 'stock',
      provider_image_id: String(payload.candidate.provider_image_id || '').slice(0, 180),
      original_url: String(payload.candidate.original_url).slice(0, 990),
      local_url: savedFile.local_url,
      file_path: savedFile.file_path,
      sha256_hash: savedFile.sha256_hash,
      search_query: String(payload.search_query || payload.candidate.title || '').slice(0, 280),
      title: String(payload.candidate.title || item.draft_title || '').slice(0, 280),
      alt_text: String(payload.alt_text || payload.candidate.alt || item.draft_title || '').slice(0, 290),
      caption: String(payload.caption || payload.candidate.description || '').slice(0, 480),
      description: String(payload.candidate.description || '').slice(0, 800),
      photographer_name: payload.candidate.photographer_name || null,
      photographer_url: payload.candidate.photographer_url || null,
      source_page_url: payload.candidate.source_page_url || null,
      license_name: payload.candidate.license_name || null,
      attribution_text: payload.candidate.attribution_text || null,
      attribution_required: payload.candidate.attribution_required ? 1 : 0,
      width: Number(savedFile.width || payload.candidate.width || 0),
      height: Number(savedFile.height || payload.candidate.height || 0),
      file_format: savedFile.file_format || 'webp',
      file_size_bytes: Number(savedFile.file_size_bytes || 0),
      placement_section: payload.placement_section || null,
      placement_index: placementIndex,
      relevance_score: 95,
      status: savedFile.status,
      is_selected: 1
    };
  } else if (payload.local_url && String(payload.local_url).startsWith('/uploads/')) {
    const resolved = resolveLocalUploadPath(payload.local_url);
    if (!resolved || !fs.existsSync(resolved)) {
      throw new Error('File gambar lokal pada Media Library tidak ditemukan di server.');
    }
    const stat = fs.statSync(resolved);
    const ext = path.extname(resolved).replace('.', '').toLowerCase() || 'webp';
    newRecord = {
      generation_item_id: item.id,
      article_id: item.published_article_id || null,
      role,
      provider: 'media_library',
      provider_image_id: path.basename(resolved),
      original_url: payload.local_url,
      local_url: payload.local_url,
      file_path: resolved,
      sha256_hash: null,
      search_query: '',
      title: String(payload.title || item.draft_title || path.basename(resolved)).slice(0, 280),
      alt_text: String(payload.alt_text || item.featured_image_alt || item.draft_title || '').slice(0, 290),
      caption: String(payload.caption || '').slice(0, 480),
      description: '',
      photographer_name: null,
      photographer_url: null,
      source_page_url: null,
      license_name: '1sLabs Media Library',
      attribution_text: null,
      attribution_required: 0,
      width: 0,
      height: 0,
      file_format: ext,
      file_size_bytes: stat.size,
      placement_section: payload.placement_section || null,
      placement_index: placementIndex,
      relevance_score: 100,
      status: 'local',
      is_selected: 1
    };
  } else if (payload.image_id && (payload.alt_text !== undefined || payload.caption !== undefined)) {
    await query(
      `UPDATE article_images SET alt_text = COALESCE(?, alt_text), caption = COALESCE(?, caption) WHERE id = ? AND generation_item_id = ?`,
      [payload.alt_text ?? null, payload.caption ?? null, Number(payload.image_id), item.id]
    );
  } else {
    throw new Error('Sertakan candidate stock image atau local_url Media Library yang valid.');
  }

  if (newRecord) {
    if (role === 'featured') {
      await query(`DELETE FROM article_images WHERE generation_item_id = ? AND role = 'featured'`, [item.id]);
    } else {
      await query(
        `DELETE FROM article_images WHERE generation_item_id = ? AND role = 'inline' AND placement_index = ?`,
        [item.id, placementIndex]
      );
    }

    await query(
      `INSERT INTO article_images
       (generation_item_id, article_id, role, provider, provider_image_id, original_url, local_url, file_path,
        sha256_hash, search_query, title, alt_text, caption, description, photographer_name, photographer_url,
        source_page_url, license_name, attribution_text, attribution_required, width, height, file_format,
        file_size_bytes, placement_section, placement_index, relevance_score, status, is_selected)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        newRecord.generation_item_id,
        newRecord.article_id,
        newRecord.role,
        newRecord.provider,
        newRecord.provider_image_id,
        newRecord.original_url,
        newRecord.local_url,
        newRecord.file_path,
        newRecord.sha256_hash,
        newRecord.search_query,
        newRecord.title,
        newRecord.alt_text,
        newRecord.caption,
        newRecord.description,
        newRecord.photographer_name,
        newRecord.photographer_url,
        newRecord.source_page_url,
        newRecord.license_name,
        newRecord.attribution_text,
        newRecord.attribution_required,
        newRecord.width,
        newRecord.height,
        newRecord.file_format,
        newRecord.file_size_bytes,
        newRecord.placement_section,
        newRecord.placement_index,
        newRecord.relevance_score,
        newRecord.status
      ]
    );
  }

  const freshImages = await getImagesForItemOrArticle({ generationItemId: item.id });
  const selectedFeatured = freshImages.find((r) => r.role === 'featured' && r.status !== 'failed') || null;
  const selectedInlines = freshImages.filter((r) => r.role === 'inline' && r.status !== 'failed');
  const rebuiltHtml = insertInlineFiguresInHtml(item.draft_content || '', selectedInlines, {
    placement: settings.inline_image_placement || 'after_h2_balanced'
  });

  await query(
    `UPDATE content_generation_items
     SET draft_featured_image = ?,
         featured_image_alt = ?,
         draft_featured_image_caption = ?,
         draft_content = ?
     WHERE id = ?`,
    [
      selectedFeatured ? selectedFeatured.local_url || selectedFeatured.original_url : item.draft_featured_image,
      selectedFeatured ? selectedFeatured.alt_text : item.featured_image_alt,
      selectedFeatured ? selectedFeatured.caption : item.draft_featured_image_caption,
      rebuiltHtml,
      item.id
    ]
  );

  return {
    images: freshImages,
    draft_featured_image: selectedFeatured ? selectedFeatured.local_url || selectedFeatured.original_url : item.draft_featured_image,
    draft_content: rebuiltHtml
  };
}

module.exports = {
  UPLOADS_ROOT,
  ARTICLE_UPLOADS_ROOT,
  getImageProvidersStatus,
  isPrivateOrReservedIp,
  assertSafePublicHttpsUrl,
  downloadImageSafe,
  searchUnsplash,
  searchPexels,
  searchPixabay,
  searchOpenverse,
  searchWikimedia,
  buildProvidersOrder,
  searchStockImages,
  resolveLocalUploadPath,
  doesLocalUploadExist,
  insertInlineFiguresInHtml,
  discoverAndAttachImagesForItem,
  getImagesForItemOrArticle,
  buildAttributionList,
  syncItemImagesToArticleStorage,
  replaceItemImageSlot,
  safeJsonParse
};

