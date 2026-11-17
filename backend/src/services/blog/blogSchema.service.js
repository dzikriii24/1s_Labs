const { query, withTransaction } = require('../../db');

let schemaInitialized = false;
let schemaInitPromise = null;

/**
 * Strip unsafe scripts/event handlers while preserving valid article rich-text HTML
 * and whitelisted embedded video players (YouTube, Vimeo, Loom).
 */
function sanitizeArticleHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  const preservedEmbeds = [];
  let clean = html;

  // Preserve safe video embed iframes before stripping general iframes
  clean = clean.replace(/<iframe\b([^>]*)>(?:[\s\S]*?<\/iframe>)?/gi, (full, attrs = '') => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const src = (srcMatch?.[1] || srcMatch?.[2] || '').trim();
    const isTrustedEmbed = /^https:\/\/(?:www\.youtube\.com\/embed\/|www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|www\.loom\.com\/embed\/)[a-zA-Z0-9_\-/?=&%.]+$/i.test(src);
    if (!isTrustedEmbed) return '';
    const token = `__ONESLABS_SAFE_EMBED_${preservedEmbeds.length}__`;
    const safeSrc = src.replace(/"/g, '&quot;');
    preservedEmbeds.push(
      `<iframe src="${safeSrc}" title="Embedded video" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
    );
    return token;
  });

  // Remove dangerous tags and their contents
  clean = clean.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  clean = clean.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*\/?>/gi, '');
  // Remove inline on* event handlers and javascript:/data:text/html URIs
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  clean = clean.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');
  clean = clean.replace(/(href|src)\s*=\s*(["'])\s*data:text\/html[^"']*\2/gi, '$1=$2#$2');

  preservedEmbeds.forEach((embedHtml, idx) => {
    clean = clean.replace(`__ONESLABS_SAFE_EMBED_${idx}__`, embedHtml);
  });

  return clean.trim();
}

/**
 * Ensures article body paragraphs use justified alignment (`text-align: justify;`)
 * while preserving CTA blocks, tables, figures, and any explicit existing text-align rules.
 */
function applyJustifiedBodyAlignment(html = '') {
  if (!html || typeof html !== 'string') return '';
  const preservedBlocks = [];
  const maskBlock = (block) => {
    const token = `__ONESLABS_ALIGN_KEEP_${preservedBlocks.length}__`;
    preservedBlocks.push(block);
    return token;
  };

  let out = html
    .replace(/<div\b[^>]*class=["'][^"']*oneslabs-cta-block[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, maskBlock)
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, maskBlock)
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, maskBlock)
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, maskBlock);

  out = out.replace(/<p(\b[^>]*)>/gi, (full, attrs = '') => {
    const styleMatch = attrs.match(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/i);
    if (styleMatch) {
      const styleVal = styleMatch[2] || '';
      if (/text-align\s*:/i.test(styleVal)) return full;
      const trimmedStyle = styleVal.trim().replace(/;?$/, '');
      const nextStyle = trimmedStyle ? `${trimmedStyle}; text-align: justify;` : 'text-align: justify;';
      return `<p${attrs.replace(styleMatch[0], `style=${styleMatch[1]}${nextStyle}${styleMatch[1]}`)}>`;
    }
    return `<p${attrs} style="text-align: justify;">`;
  });

  preservedBlocks.forEach((block, idx) => {
    out = out.replace(`__ONESLABS_ALIGN_KEEP_${idx}__`, block);
  });

  return out.trim();
}

/**
 * Convert HTML content into plain readable text for word counts & excerpts.
 */
function stripHtmlToText(html = '') {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate URL-safe slug from Indonesian/English titles.
 */
function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180) || 'artikel-1slabs';
}

/**
 * Calculate estimated reading time in minutes at ~200 words/minute.
 */
function calculateReadingTime(htmlOrText = '') {
  const plain = stripHtmlToText(htmlOrText);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

async function seedDefaults() {
  const existingCats = await query('SELECT COUNT(*) AS total FROM blog_categories');
  if (Number(existingCats[0]?.total || 0) === 0) {
    const defaultCategories = [
      {
        name: 'Web Engineering & Software',
        slug: 'web-engineering',
        description: 'Arsitektur aplikasi web custom, pay-once software, integrasi sistem, dan best practice engineering.',
        color: '#2563eb',
        sort_order: 1
      },
      {
        name: 'Cloud & Managed Hosting',
        slug: 'cloud-hosting',
        description: 'Panduan performa server, optimasi VPS & LiteSpeed, keamanan SSL, backup, serta infrastruktur hosting 1sLabs.',
        color: '#0284c7',
        sort_order: 2
      },
      {
        name: 'SEO & Digital Growth',
        slug: 'seo-digital-growth',
        description: 'Strategi SEO teknis, optimasi GEO untuk AI search, riset kata kunci, dan pertumbuhan trafik organik bisnis.',
        color: '#0d9488',
        sort_order: 3
      },
      {
        name: 'UI/UX & Product Design',
        slug: 'ui-ux-product',
        description: 'Desain antarmuka modern, konversi landing page, aksesibilitas web, dan pengalaman pengguna digital.',
        color: '#4f46e5',
        sort_order: 4
      },
      {
        name: 'Panduan & Insight Bisnis',
        slug: 'panduan-bisnis',
        description: 'Digitalisasi UMKM dan perusahaan Indonesia, efisiensi operasional TI, serta panduan memilih solusi teknologi.',
        color: '#059669',
        sort_order: 5
      }
    ];

    for (const cat of defaultCategories) {
      await query(
        `INSERT IGNORE INTO blog_categories (name, slug, description, color, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [cat.name, cat.slug, cat.description, cat.color, cat.sort_order]
      );
    }
  }

  const existingClusters = await query('SELECT COUNT(*) AS total FROM blog_topic_clusters');
  if (Number(existingClusters[0]?.total || 0) === 0) {
    const defaultClusters = [
      {
        name: 'Managed Web Hosting & Infrastruktur Cloud',
        pillar_title: 'Panduan Lengkap Memilih Managed Web Hosting Cepat & Aman untuk Bisnis Indonesia',
        pillar_slug: 'panduan-managed-web-hosting-bisnis',
        target_keyword: 'managed web hosting indonesia',
        search_intent: 'commercial',
        status: 'active',
        notes: 'Pilar utama mendukung layanan Managed Web Hosting 1sLabs (/hosting & /service/managed-hosting).'
      },
      {
        name: 'Custom Web App & Pay-Once Software',
        pillar_title: 'Custom Web Application vs SaaS Langganan: Kapan Bisnis Sebaiknya Beralih ke Pay-Once Software?',
        pillar_slug: 'custom-web-app-vs-saas-pay-once-software',
        target_keyword: 'jasa pembuatan web aplikasi custom',
        search_intent: 'commercial',
        status: 'active',
        notes: 'Menjelaskan keunggulan model Pay-Once Software & custom system architecture di 1sLabs.'
      },
      {
        name: 'Technical SEO, Core Web Vitals & GEO Optimization',
        pillar_title: 'Checklist Technical SEO & GEO Readiness agar Website Bisnis Mudah Ditemukan di Google & AI Search',
        pillar_slug: 'checklist-technical-seo-geo-readiness',
        target_keyword: 'optimasi technical seo website',
        search_intent: 'informational',
        status: 'active',
        notes: 'Edukasi teknis SEO, struktur heading, schema JSON-LD, dan kesiapan sitasi AI search.'
      }
    ];

    for (const cl of defaultClusters) {
      await query(
        `INSERT INTO blog_topic_clusters (name, pillar_title, pillar_slug, target_keyword, search_intent, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cl.name, cl.pillar_title, cl.pillar_slug, cl.target_keyword, cl.search_intent, cl.status, cl.notes]
      );
    }
  }
}

/**
 * Create all Blog & SEO Intelligence tables idempotently inside u1zh8984_oneslabs.
 */
async function ensureBlogSchema() {
  if (schemaInitialized) return;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(140) NOT NULL,
        description TEXT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#2563eb',
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_blog_categories_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_topic_clusters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        pillar_title VARCHAR(255) NOT NULL,
        pillar_slug VARCHAR(220) NULL,
        target_keyword VARCHAR(180) NOT NULL,
        search_intent ENUM('informational','commercial','transactional','navigational') NOT NULL DEFAULT 'informational',
        status ENUM('planned','active','completed') NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_cluster_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(220) NOT NULL,
        excerpt TEXT NULL,
        content LONGTEXT NULL,
        featured_image VARCHAR(500) NULL,
        featured_image_alt VARCHAR(300) NULL,
        category_id INT NULL,
        author_id INT NULL,
        author_name VARCHAR(140) NOT NULL DEFAULT 'Tim Editorial 1sLabs',
        status ENUM('ideas','draft','in_review','needs_revision','scheduled','published') NOT NULL DEFAULT 'draft',
        priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        due_date DATE NULL,
        editorial_notes TEXT NULL,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        views INT NOT NULL DEFAULT 0,
        reading_time INT NOT NULL DEFAULT 1,
        meta_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        focus_keyphrase VARCHAR(180) NULL,
        secondary_keyphrases TEXT NULL,
        canonical_url VARCHAR(500) NULL,
        robots_directive VARCHAR(80) NOT NULL DEFAULT 'index,follow',
        og_title VARCHAR(255) NULL,
        og_description TEXT NULL,
        og_image VARCHAR(500) NULL,
        schema_type VARCHAR(60) NOT NULL DEFAULT 'BlogPosting',
        faq_schema_json LONGTEXT NULL,
        seo_score INT NOT NULL DEFAULT 0,
        readability_score INT NOT NULL DEFAULT 0,
        geo_score INT NOT NULL DEFAULT 0,
        seo_audit_json LONGTEXT NULL,
        seo_audit_at DATETIME NULL,
        cluster_id INT NULL,
        is_pillar TINYINT(1) NOT NULL DEFAULT 0,
        published_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_blog_articles_slug (slug),
        KEY idx_blog_status_pub (status, published_at),
        KEY idx_blog_category (category_id),
        KEY idx_blog_cluster (cluster_id),
        KEY idx_blog_seo_score (seo_score),
        CONSTRAINT fk_blog_article_category FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL,
        CONSTRAINT fk_blog_article_cluster FOREIGN KEY (cluster_id) REFERENCES blog_topic_clusters(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_blog_tags_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_article_tags (
        article_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (article_id, tag_id),
        CONSTRAINT fk_bat_article FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE,
        CONSTRAINT fk_bat_tag FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_article_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        editor_id INT NULL,
        editor_name VARCHAR(140) NULL,
        revision_type ENUM('manual','ai_optimize','autosave','revert') NOT NULL DEFAULT 'manual',
        title VARCHAR(255) NOT NULL,
        excerpt TEXT NULL,
        content LONGTEXT NULL,
        meta_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        focus_keyphrase VARCHAR(180) NULL,
        seo_score INT NOT NULL DEFAULT 0,
        readability_score INT NOT NULL DEFAULT 0,
        geo_score INT NOT NULL DEFAULT 0,
        change_summary VARCHAR(500) NULL,
        diff_json LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_rev_article (article_id, created_at),
        CONSTRAINT fk_rev_article FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_gsc_settings (
        id INT PRIMARY KEY,
        site_url VARCHAR(255) NOT NULL DEFAULT 'https://1slabs.my.id',
        client_id VARCHAR(255) NULL,
        client_secret VARCHAR(255) NULL,
        access_token TEXT NULL,
        refresh_token TEXT NULL,
        token_expires_at DATETIME NULL,
        oauth_state VARCHAR(128) NULL,
        oauth_state_expires_at DATETIME NULL,
        connected_email VARCHAR(190) NULL,
        last_synced_at DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      INSERT IGNORE INTO blog_gsc_settings (id, site_url) VALUES (1, 'https://1slabs.my.id')
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_gsc_performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_url VARCHAR(255) NOT NULL,
        query_text VARCHAR(255) NULL,
        page_url VARCHAR(500) NULL,
        clicks INT NOT NULL DEFAULT 0,
        impressions INT NOT NULL DEFAULT 0,
        ctr DECIMAL(7,4) NOT NULL DEFAULT 0,
        position DECIMAL(6,2) NOT NULL DEFAULT 0,
        prev_clicks INT NOT NULL DEFAULT 0,
        prev_impressions INT NOT NULL DEFAULT 0,
        prev_position DECIMAL(6,2) NOT NULL DEFAULT 0,
        date_range_start DATE NULL,
        date_range_end DATE NULL,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_gsc_query (query_text(120)),
        KEY idx_gsc_page (page_url(180)),
        KEY idx_gsc_clicks (clicks)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_content_ideas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cluster_id INT NULL,
        title VARCHAR(255) NOT NULL,
        target_keyword VARCHAR(180) NULL,
        search_intent ENUM('informational','commercial','transactional','navigational') NOT NULL DEFAULT 'informational',
        priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
        rationale TEXT NULL,
        suggested_outline_json LONGTEXT NULL,
        source ENUM('manual','ai_gap','gsc_opportunity') NOT NULL DEFAULT 'manual',
        status ENUM('idea','planned','drafted','dismissed') NOT NULL DEFAULT 'idea',
        linked_article_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_ideas_status (status),
        CONSTRAINT fk_idea_cluster FOREIGN KEY (cluster_id) REFERENCES blog_topic_clusters(id) ON DELETE SET NULL,
        CONSTRAINT fk_idea_article FOREIGN KEY (linked_article_id) REFERENCES blog_articles(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS blog_seo_redirects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_path VARCHAR(255) NOT NULL,
        target_url VARCHAR(500) NOT NULL,
        status_code INT NOT NULL DEFAULT 301,
        hits INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_redirect_source (source_path),
        KEY idx_redirect_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Non-destructive column upgrades for WordPress-style visibility & featured caption / attribution
    const [visCols, capCols, attrCols] = await Promise.all([
      query("SHOW COLUMNS FROM blog_articles LIKE 'visibility'"),
      query("SHOW COLUMNS FROM blog_articles LIKE 'featured_image_caption'"),
      query("SHOW COLUMNS FROM blog_articles LIKE 'image_attribution_json'")
    ]);
    if (visCols.length === 0) {
      await query(
        "ALTER TABLE blog_articles ADD COLUMN visibility ENUM('public','unlisted','private') NOT NULL DEFAULT 'public' AFTER status"
      );
    }
    if (capCols.length === 0) {
      await query(
        'ALTER TABLE blog_articles ADD COLUMN featured_image_caption VARCHAR(500) NULL AFTER featured_image_alt'
      );
    }
    if (attrCols.length === 0) {
      await query(
        'ALTER TABLE blog_articles ADD COLUMN image_attribution_json JSON NULL AFTER featured_image_caption'
      );
    }

    await seedDefaults();
    schemaInitialized = true;
  })().catch((err) => {
    schemaInitPromise = null;
    throw err;
  });

  return schemaInitPromise;
}

/**
 * Automatically transition due 'scheduled' articles to 'published' without cron dependency.
 */
let lastScheduleCheck = 0;
async function publishDueScheduledArticles(force = false) {
  const now = Date.now();
  if (!force && now - lastScheduleCheck < 30000) {
    return 0;
  }
  lastScheduleCheck = now;
  try {
    await ensureBlogSchema();
    const result = await query(
      `UPDATE blog_articles
       SET status = 'published'
       WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= NOW()`
    );
    return Number(result?.affectedRows || 0);
  } catch (err) {
    console.error('[BlogScheduler] Error publishing due articles:', err.message);
    return 0;
  }
}

/**
 * Upsert tags array and attach them to an article inside a transaction or pool.
 */
async function syncArticleTags(articleId, tagNames = []) {
  if (!Array.isArray(tagNames)) return [];
  const normalized = [];
  const seen = new Set();
  for (const raw of tagNames) {
    const clean = String(raw || '').trim();
    if (!clean) continue;
    const s = slugify(clean);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    normalized.push({ name: clean.slice(0, 90), slug: s.slice(0, 110) });
  }

  return withTransaction(async (conn) => {
    await conn.execute('DELETE FROM blog_article_tags WHERE article_id = ?', [articleId]);
    const saved = [];
    for (const tag of normalized) {
      await conn.execute(
        'INSERT IGNORE INTO blog_tags (name, slug) VALUES (?, ?)',
        [tag.name, tag.slug]
      );
      const [rows] = await conn.execute('SELECT id, name, slug FROM blog_tags WHERE slug = ? LIMIT 1', [tag.slug]);
      if (rows[0]) {
        await conn.execute(
          'INSERT IGNORE INTO blog_article_tags (article_id, tag_id) VALUES (?, ?)',
          [articleId, rows[0].id]
        );
        saved.push(rows[0]);
      }
    }
    return saved;
  });
}

module.exports = {
  ensureBlogSchema,
  publishDueScheduledArticles,
  syncArticleTags,
  sanitizeArticleHtml,
  applyJustifiedBodyAlignment,
  stripHtmlToText,
  slugify,
  calculateReadingTime
};

