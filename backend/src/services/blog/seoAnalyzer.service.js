const { stripHtmlToText } = require('./blogSchema.service');

const INDONESIAN_TRANSITIONS = [
  'selain itu', 'oleh karena itu', 'namun', 'sebaliknya', 'misalnya', 'contohnya',
  'singkatnya', 'kesimpulannya', 'dengan demikian', 'artinya', 'pasalnya', 'akibatnya',
  'pada dasarnya', 'di sisi lain', 'lebih lanjut', 'terlebih lagi', 'selanjutnya',
  'pertama', 'kedua', 'ketiga', 'terakhir', 'walaupun demikian', 'meskipun begitu',
  'sebagai contoh', 'sebagai hasilnya', 'pada praktiknya', 'penting dicatat'
];

const ENGLISH_TRANSITIONS = [
  'however', 'therefore', 'furthermore', 'moreover', 'additionally', 'for example',
  'in contrast', 'consequently', 'meanwhile', 'as a result', 'in summary',
  'specifically', 'importantly', 'nevertheless', 'for instance'
];

const NON_PASSIVE_DI_WORDS = new Set([
  'dimana', 'disini', 'disitu', 'disana', 'diatas', 'dibawah', 'diantara', 'didalam',
  'diluar', 'digital', 'dinamis', 'distribusi', 'direktori', 'diagnosa', 'diskon',
  'dimensi', 'direktur', 'divisi', 'dialog', 'diagram', 'disiplin', 'diskusi', 'desain',
  'dipilihnya', 'diri', 'dinas', 'dini', 'dingin'
]);

const ENTITY_TERMS = [
  '1slabs', 'indonesia', 'website', 'aplikasi', 'software', 'cloud', 'hosting', 'vps',
  'server', 'api', 'database', 'mysql', 'react', 'node.js', 'seo', 'geo', 'google',
  'litespeed', 'ssl', 'https', 'core web vitals', 'schema', 'json-ld', 'umkm', 'enterprise'
];

const INTENT_PATTERNS = {
  informational: ['apa itu', 'cara', 'panduan', 'tutorial', 'tips', 'langkah', 'penyebab', 'pengertian', 'arti', 'checklist', 'how to', 'guide'],
  commercial: ['terbaik', 'perbandingan', 'vs', 'review', 'rekomendasi', 'kelebihan', 'kekurangan', 'memilih', 'comparison', 'best'],
  transactional: ['jasa', 'harga', 'biaya', 'paket', 'beli', 'pesan', 'sewa', 'konsultasi', 'layanan', 'service', 'pricing']
};

function decodeEntities(str = '') {
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function estimatePixelWidth(text = '', fontSizePx = 20) {
  let width = 0;
  for (const ch of String(text || '')) {
    if ('iIl1.,|!:\'"` '.includes(ch)) width += fontSizePx * 0.28;
    else if ('mwMW@%&'.includes(ch)) width += fontSizePx * 0.88;
    else if (ch >= 'A' && ch <= 'Z') width += fontSizePx * 0.68;
    else width += fontSizePx * 0.54;
  }
  return Math.round(width);
}

function extractTags(html = '', tagRegex) {
  const results = [];
  let m;
  while ((m = tagRegex.exec(html)) !== null) {
    results.push(m);
  }
  return results;
}

function normalizeWords(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function countKeyphraseOccurrences(haystack = '', keyphrase = '') {
  const cleanHaystack = String(haystack || '').toLowerCase();
  const cleanKey = String(keyphrase || '').toLowerCase().trim();
  if (!cleanHaystack || !cleanKey) return 0;

  const escaped = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'gi');
  const exactMatches = cleanHaystack.match(regex);
  if (exactMatches && exactMatches.length > 0) return exactMatches.length;

  // Fallback for multi-word phrases when words appear consecutively with punctuation
  const words = normalizeWords(cleanKey);
  if (words.length >= 2) {
    const loose = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s,.;:-]+'), 'gi');
    const looseMatches = cleanHaystack.match(loose);
    return looseMatches ? looseMatches.length : 0;
  }
  return 0;
}

function containsKeyphraseOrCoreTerms(text = '', keyphrase = '') {
  const cleanText = String(text || '').toLowerCase();
  const cleanKey = String(keyphrase || '').toLowerCase().trim();
  if (!cleanText || !cleanKey) return false;
  if (cleanText.includes(cleanKey)) return true;

  const keyWords = normalizeWords(cleanKey).filter((w) => w.length >= 3);
  if (keyWords.length === 0) return false;
  const matchedCount = keyWords.filter((kw) => cleanText.includes(kw)).length;
  return matchedCount >= Math.ceil(keyWords.length * 0.75);
}

function detectIntent(text = '') {
  const lower = String(text || '').toLowerCase();
  for (const [intent, markers] of Object.entries(INTENT_PATTERNS)) {
    if (markers.some((m) => lower.includes(m))) return intent;
  }
  return 'informational';
}

/**
 * Deterministic Yoast-inspired SEO, Readability & GEO Readiness Engine.
 */
function analyzeArticle(article = {}) {
  const title = String(article.title || '').trim();
  const metaTitle = String(article.meta_title || title).trim();
  const metaDescription = String(article.meta_description || article.excerpt || '').trim();
  const slug = String(article.slug || '').trim().toLowerCase();
  const focusKeyphrase = String(article.focus_keyphrase || '').trim();
  const contentHtml = String(article.content || '');
  const featuredImage = String(article.featured_image || '').trim();
  const featuredImageAlt = String(article.featured_image_alt || '').trim();
  const authorName = String(article.author_name || '').trim();

  let faqItems = [];
  if (Array.isArray(article.faq_items)) {
    faqItems = article.faq_items;
  } else if (typeof article.faq_schema_json === 'string' && article.faq_schema_json.trim()) {
    try {
      const parsed = JSON.parse(article.faq_schema_json);
      if (Array.isArray(parsed)) faqItems = parsed;
    } catch {
      faqItems = [];
    }
  }

  const plainText = stripHtmlToText(contentHtml);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Sentences
  const sentences = plainText
    ? plainText
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2)
    : [];

  // Paragraphs
  const pMatches = extractTags(contentHtml, /<p\b[^>]*>([\s\S]*?)<\/p>/gi).map((m) =>
    stripHtmlToText(decodeEntities(m[1]))
  ).filter(Boolean);
  const paragraphs = pMatches.length > 0
    ? pMatches
    : plainText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // Headings
  const headingMatches = extractTags(contentHtml, /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi).map((m) => ({
    tag: m[1].toLowerCase(),
    text: stripHtmlToText(decodeEntities(m[2]))
  }));
  const h1InBody = headingMatches.filter((h) => h.tag === 'h1');
  const subheadings = headingMatches.filter((h) => h.tag === 'h2' || h.tag === 'h3');
  const h2Headings = headingMatches.filter((h) => h.tag === 'h2');

  // Links
  const anchorMatches = extractTags(contentHtml, /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi).map((m) => ({
    href: String(m[2] || '').trim(),
    text: stripHtmlToText(decodeEntities(m[3]))
  }));
  const internalLinks = anchorMatches.filter((a) =>
    a.href.startsWith('/') || a.href.includes('1slabs.my.id')
  );
  const externalLinks = anchorMatches.filter((a) =>
    /^https?:\/\//i.test(a.href) && !a.href.includes('1slabs.my.id')
  );

  // Images inside content
  const imgMatches = extractTags(contentHtml, /<img\b([^>]*)>/gi).map((m) => {
    const attrs = m[1] || '';
    const srcM = attrs.match(/\bsrc=(["'])(.*?)\1/i);
    const altM = attrs.match(/\balt=(["'])(.*?)\1/i);
    return {
      src: srcM ? srcM[2] : '',
      alt: altM ? altM[2].trim() : ''
    };
  });
  const imagesMissingAlt = imgMatches.filter((i) => !i.alt);

  // Structured blocks
  const listCount = extractTags(contentHtml, /<(ul|ol)\b[^>]*>/gi).length;
  const tableCount = extractTags(contentHtml, /<table\b[^>]*>/gi).length;
  const calloutCount = extractTags(contentHtml, /class=(["'])[^"']*callout-box[^"']*\1/gi).length +
    extractTags(contentHtml, /<blockquote\b[^>]*>/gi).length;

  const checks = [];
  const addCheck = (category, id, titleText, status, priority, detail, recommendation, action_type = null) => {
    checks.push({ category, id, title: titleText, status, priority, detail, recommendation, action_type });
  };

  // ==================== 1. SEO SCORE EVALUATION (100 pts max) ====================
  let seoEarned = 0;
  const seoMax = 100;

  // 1a. Focus Keyphrase defined (10 pts)
  const keyphraseWords = focusKeyphrase ? focusKeyphrase.split(/\s+/).filter(Boolean).length : 0;
  if (!focusKeyphrase) {
    addCheck('seo', 'focus_keyphrase', 'Focus Keyphrase', 'problem', 'critical',
      'Focus keyphrase belum ditentukan.',
      'Tetapkan 1 kata kunci utama spesifik (2–5 kata) sesuai intensi pencarian target 1sLabs.',
      'ai_keyphrases');
  } else if (keyphraseWords >= 2 && keyphraseWords <= 5) {
    seoEarned += 10;
    addCheck('seo', 'focus_keyphrase', 'Focus Keyphrase', 'good', 'low',
      `Focus keyphrase "${focusKeyphrase}" (${keyphraseWords} kata) spesifik dan ideal untuk long-tail SEO.`,
      'Pertahankan fokus pada satu topik utama per artikel.');
  } else {
    seoEarned += 6;
    addCheck('seo', 'focus_keyphrase', 'Focus Keyphrase', 'warning', 'medium',
      `Focus keyphrase "${focusKeyphrase}" terdiri dari ${keyphraseWords} kata.`,
      'Idealnya 2–5 kata agar relevan namun tidak terlalu luas atau terlalu sempit.',
      'ai_keyphrases');
  }

  // 1b. SEO Title length + pixel width + keyphrase placement (14 pts)
  const titleLen = metaTitle.length;
  const titlePixels = estimatePixelWidth(metaTitle, 20);
  const titleHasKey = focusKeyphrase ? containsKeyphraseOrCoreTerms(metaTitle, focusKeyphrase) : false;
  if (titleLen === 0) {
    addCheck('seo', 'seo_title', 'SEO Title', 'problem', 'critical',
      'Judul SEO masih kosong.',
      'Buat judul SEO 45–60 karakter dengan kata kunci utama di bagian awal.',
      'ai_titles');
  } else if (titleLen >= 40 && titleLen <= 62 && titlePixels <= 600 && (!focusKeyphrase || titleHasKey)) {
    seoEarned += 14;
    addCheck('seo', 'seo_title', 'SEO Title', 'good', 'low',
      `Panjang SEO Title ${titleLen} karakter (~${titlePixels}px) optimal dan mengandung topik utama.`,
      'Judul siap tampil utuh di hasil pencarian Google desktop & mobile.');
  } else {
    const partialTitle = (titleLen >= 30 && titleLen <= 68 ? 7 : 3) + (titleHasKey ? 3 : 0);
    seoEarned += partialTitle;
    addCheck('seo', 'seo_title', 'SEO Title', titleLen > 68 || !titleHasKey ? 'warning' : 'good', 'high',
      `SEO Title ${titleLen} karakter (~${titlePixels}px). ${focusKeyphrase && !titleHasKey ? 'Kata kunci utama belum masuk di SEO Title.' : ''}`,
      'Jaga SEO Title di kisaran 45–60 karakter (maks ~580px) dan letakkan kata kunci sedekat mungkin di awal.',
      'ai_titles');
  }

  // 1c. Meta Description length + keyphrase (12 pts)
  const descLen = metaDescription.length;
  const descHasKey = focusKeyphrase ? containsKeyphraseOrCoreTerms(metaDescription, focusKeyphrase) : false;
  if (descLen === 0) {
    addCheck('seo', 'meta_description', 'Meta Description', 'problem', 'high',
      'Meta description belum diisi.',
      'Tulis ringkasan 125–158 karakter yang memuat kata kunci utama dan nilai manfaat artikel.',
      'ai_descriptions');
  } else if (descLen >= 120 && descLen <= 160 && (!focusKeyphrase || descHasKey)) {
    seoEarned += 12;
    addCheck('seo', 'meta_description', 'Meta Description', 'good', 'low',
      `Meta description ${descLen} karakter berada pada rentang ideal SERP dan memuat kata kunci.`,
      'Pastikan kalimat tetap mengajak klik secara natural tanpa clickbait.');
  } else {
    seoEarned += descLen >= 80 && descLen <= 175 ? 7 : 4;
    addCheck('seo', 'meta_description', 'Meta Description', 'warning', 'medium',
      `Meta description ${descLen} karakter${focusKeyphrase && !descHasKey ? ' dan belum memuat focus keyphrase' : ''}.`,
      'Optimalkan ke rentang 120–158 karakter agar tidak terpotong di SERP Google.',
      'ai_descriptions');
  }

  // 1d. URL Slug (8 pts)
  const slugHasKey = focusKeyphrase ? containsKeyphraseOrCoreTerms(slug.replace(/-/g, ' '), focusKeyphrase) : false;
  if (!slug) {
    addCheck('seo', 'url_slug', 'URL Slug', 'problem', 'high',
      'Slug URL artikel belum tersedia.',
      'Gunakan slug ringkas berbahasa jelas dengan tanda hubung (-) yang mengandung kata kunci.');
  } else if (slug.length <= 68 && (!focusKeyphrase || slugHasKey)) {
    seoEarned += 8;
    addCheck('seo', 'url_slug', 'URL Slug', 'good', 'low',
      `Slug "/blog/${slug}" (${slug.length} karakter) bersih dan relevan dengan kata kunci.`,
      'Hindari mengubah slug setelah artikel diindeks Google kecuali memasang redirect 301.');
  } else {
    seoEarned += 4;
    addCheck('seo', 'url_slug', 'URL Slug', 'warning', 'medium',
      `Slug "${slug}" (${slug.length} karakter)${focusKeyphrase && !slugHasKey ? ' belum mencerminkan focus keyphrase' : ' cukup panjang'}.`,
      'Ringkas slug maksimal 4–7 kata dan masukkan inti kata kunci utama.');
  }

  // 1e. Keyword in Opening Paragraph / First 100 words (10 pts)
  const first100Words = words.slice(0, 100).join(' ');
  const introHasKey = focusKeyphrase ? containsKeyphraseOrCoreTerms(first100Words, focusKeyphrase) : false;
  if (!focusKeyphrase) {
    seoEarned += 4;
  } else if (introHasKey) {
    seoEarned += 10;
    addCheck('seo', 'intro_keyphrase', 'Kata Kunci di Paragraf Pembuka', 'good', 'low',
      'Kata kunci utama sudah muncul di 100 kata pertama artikel.',
      'Sinyal relevansi awal untuk mesin pencari dan pembaca sudah tepat.');
  } else {
    addCheck('seo', 'intro_keyphrase', 'Kata Kunci di Paragraf Pembuka', 'problem', 'high',
      'Focus keyphrase belum muncul di paragraf pembuka (100 kata pertama).',
      'Masukkan kata kunci utama secara natural dalam 2 kalimat pertama pembuka artikel.',
      'ai_intro');
  }

  // 1f. Keyphrase Density & Distribution (10 pts)
  const keyphraseCount = focusKeyphrase ? countKeyphraseOccurrences(plainText, focusKeyphrase) : 0;
  const keyphraseDensity = wordCount > 0 && focusKeyphrase
    ? Number((((keyphraseCount * Math.max(1, keyphraseWords)) / wordCount) * 100).toFixed(2))
    : 0;
  if (!focusKeyphrase) {
    seoEarned += 3;
  } else if (keyphraseCount >= 2 && keyphraseDensity >= 0.45 && keyphraseDensity <= 2.9) {
    seoEarned += 10;
    addCheck('seo', 'keyword_density', 'Kepadatan & Distribusi Kata Kunci', 'good', 'low',
      `Kata kunci terdeteksi ${keyphraseCount}x (${keyphraseDensity}% dari total kata), seimbang dan natural.`,
      'Pertahankan variasi sinonim/LSI agar tidak terasa repetitif.');
  } else if (keyphraseDensity > 2.9) {
    seoEarned += 4;
    addCheck('seo', 'keyword_density', 'Kepadatan & Distribusi Kata Kunci', 'warning', 'high',
      `Kepadatan kata kunci terlalu tinggi (${keyphraseDensity}%, ${keyphraseCount}x). Berisiko terdeteksi keyword stuffing.`,
      'Kurangi pengulangan kata kunci identik dan ganti sebagian dengan variasi frasa atau pronomina.',
      'ai_keyword_distribution');
  } else {
    seoEarned += wordCount > 0 && keyphraseCount >= 1 ? 5 : 1;
    addCheck('seo', 'keyword_density', 'Kepadatan & Distribusi Kata Kunci', 'warning', 'medium',
      `Kata kunci hanya muncul ${keyphraseCount}x (${keyphraseDensity}%). Target sehat berada di 0.5%–2.5%.`,
      'Distribusikan kata kunci secara natural ke beberapa bagian penjelasan utama.',
      'ai_keyword_distribution');
  }

  // 1g. Keyword in Subheadings (8 pts)
  const subheadingsWithKey = focusKeyphrase
    ? subheadings.filter((h) => containsKeyphraseOrCoreTerms(h.text, focusKeyphrase)).length
    : 0;
  if (subheadings.length === 0) {
    addCheck('seo', 'subheading_keyphrase', 'Struktur & Kata Kunci di Subheading', 'problem', 'high',
      'Artikel belum memiliki subheading H2/H3.',
      'Pecah artikel menjadi bagian dengan heading H2 dan H3 yang jelas.',
      'ai_headings');
  } else if (!focusKeyphrase || (subheadingsWithKey >= 1 && subheadingsWithKey <= Math.max(2, Math.ceil(subheadings.length * 0.75)))) {
    seoEarned += 8;
    addCheck('seo', 'subheading_keyphrase', 'Kata Kunci di Subheading', 'good', 'low',
      `${subheadingsWithKey} dari ${subheadings.length} subheading H2/H3 memuat konteks kata kunci utama.`,
      'Struktur topik subheading mendukung pemetaan relevansi Google.');
  } else if (subheadingsWithKey === 0) {
    seoEarned += 3;
    addCheck('seo', 'subheading_keyphrase', 'Kata Kunci di Subheading', 'warning', 'medium',
      `Belum ada dari ${subheadings.length} subheading H2/H3 yang memuat kata kunci "${focusKeyphrase}".`,
      'Sisipkan kata kunci utama atau variasi intinya secara alami pada 1–2 heading H2.',
      'ai_headings');
  } else {
    seoEarned += 5;
    addCheck('seo', 'subheading_keyphrase', 'Kata Kunci di Subheading', 'warning', 'low',
      `Terlalu banyak subheading (${subheadingsWithKey}/${subheadings.length}) mengulang kata kunci persis.`,
      'Variasikan teks heading agar membaca lebih natural.');
  }

  // 1h. Content Depth / Word Count (10 pts)
  if (wordCount >= 900) {
    seoEarned += 10;
    addCheck('seo', 'content_length', 'Kedalaman Konten', 'good', 'low',
      `Artikel memiliki ${wordCount} kata — mendalam untuk bersaing pada kueri kompetitif.`,
      'Pastikan setiap paragraf tetap padat informasi tanpa kalimat pengisi.');
  } else if (wordCount >= 600) {
    seoEarned += 8;
    addCheck('seo', 'content_length', 'Kedalaman Konten', 'good', 'low',
      `Artikel memiliki ${wordCount} kata — memenuhi standar kedalaman artikel informatif.`,
      'Menambah contoh kasus atau FAQ teknis bisa memperkuat cakupan topik.');
  } else if (wordCount >= 300) {
    seoEarned += 5;
    addCheck('seo', 'content_length', 'Kedalaman Konten', 'warning', 'medium',
      `Konten baru ${wordCount} kata (disarankan minimal 600–900 kata untuk artikel blog strategis).`,
      'Lengkapi dengan langkah implementasi, studi kasus relevan, atau bagian FAQ.');
  } else {
    seoEarned += wordCount > 100 ? 2 : 0;
    addCheck('seo', 'content_length', 'Kedalaman Konten', 'problem', 'critical',
      `Konten terlalu pendek (${wordCount} kata). Berisiko dianggap thin content.`,
      'Tambahkan pembahasan terstruktur minimal 600 kata.');
  }

  // 1i. Internal Links (6 pts)
  if (internalLinks.length >= 2) {
    seoEarned += 6;
    addCheck('seo', 'internal_links', 'Internal Linking', 'good', 'low',
      `Terdapat ${internalLinks.length} tautan internal ke halaman/artikel 1sLabs lainnya.`,
      'Pastikan anchor text bersifat deskriptif terhadap halaman tujuan.');
  } else if (internalLinks.length === 1) {
    seoEarned += 3;
    addCheck('seo', 'internal_links', 'Internal Linking', 'warning', 'medium',
      'Baru ada 1 internal link di dalam isi artikel.',
      'Tambahkan minimal 2–3 tautan internal menuju layanan terkait (/hosting, /docs) atau artikel klaster.',
      'ai_internal_links');
  } else {
    addCheck('seo', 'internal_links', 'Internal Linking', 'problem', 'high',
      'Belum ada internal link sama sekali di isi artikel.',
      'Hubungkan artikel ini ke halaman layanan atau artikel relevan 1sLabs dengan anchor text natural.',
      'ai_internal_links');
  }

  // 1j. External Links (4 pts)
  if (externalLinks.length >= 1) {
    seoEarned += 4;
    addCheck('seo', 'external_links', 'External Reference Links', 'good', 'low',
      `Terdapat ${externalLinks.length} referensi eksternal sebagai penguat sumber informasi.`,
      'Pastikan link eksternal mengarah ke dokumentasi resmi atau sumber kredibel.');
  } else {
    seoEarned += 1;
    addCheck('seo', 'external_links', 'External Reference Links', 'warning', 'low',
      'Belum ada link referensi eksternal.',
      'Sertakan 1–2 tautan ke dokumentasi resmi (mis. Google Search Central, MDN, RFC) bila membahas standar teknis.');
  }

  // 1k. Featured Image + Alt Text + Search Intent (8 pts)
  let mediaSeoPts = 0;
  if (featuredImage && featuredImageAlt) {
    mediaSeoPts += 4;
  } else if (featuredImage) {
    mediaSeoPts += 1;
  }
  if (imgMatches.length === 0 || imagesMissingAlt.length === 0) {
    mediaSeoPts += 2;
  }
  if (!featuredImage) {
    addCheck('seo', 'image_alt', 'Featured Image & Alt Text', 'warning', 'medium',
      'Featured image belum dipilih.',
      'Tambahkan gambar sampul yang relevan dengan rasio 16:9 beserta Alt Text deskriptif.',
      'ai_alt_text');
  } else if (!featuredImageAlt || imagesMissingAlt.length > 0) {
    addCheck('seo', 'image_alt', 'Image Alt Text', 'warning', 'medium',
      `${!featuredImageAlt ? 'Alt text featured image masih kosong. ' : ''}${imagesMissingAlt.length > 0 ? `${imagesMissingAlt.length} gambar di isi artikel belum memiliki atribut alt.` : ''}`,
      'Isi Alt Text deskriptif untuk aksesibilitas dan indeksasi Google Images.',
      'ai_alt_text');
  } else {
    addCheck('seo', 'image_alt', 'Image Alt Text', 'good', 'low',
      'Featured image dan seluruh gambar di konten sudah memiliki Alt Text.',
      'Pastikan alt text benar-benar menjelaskan isi visual gambar.');
  }

  // Search Intent Alignment (2 pts)
  const titleIntent = detectIntent(metaTitle);
  const keyphraseIntent = detectIntent(focusKeyphrase || metaTitle);
  if (titleIntent === keyphraseIntent || !focusKeyphrase) {
    mediaSeoPts += 2;
  } else {
    mediaSeoPts += 1;
  }
  seoEarned += mediaSeoPts;

  const seoScore = Math.max(0, Math.min(100, Math.round((seoEarned / seoMax) * 100)));

  // ==================== 2. READABILITY SCORE EVALUATION (100 pts max) ====================
  let readEarned = 0;
  const readMax = 100;

  // 2a. Sentence length (25 pts)
  const longSentences = sentences.filter((s) => s.split(/\s+/).filter(Boolean).length > 22);
  const longSentenceRatio = sentences.length > 0 ? Math.round((longSentences.length / sentences.length) * 100) : 0;
  if (sentences.length === 0) {
    addCheck('readability', 'sentence_length', 'Panjang Kalimat', 'problem', 'high',
      'Belum cukup kalimat untuk dievaluasi.',
      'Tulis artikel dengan kalimat yang jelas dan variatif.');
  } else if (longSentenceRatio <= 25) {
    readEarned += 25;
    addCheck('readability', 'sentence_length', 'Panjang Kalimat', 'good', 'low',
      `Hanya ${longSentenceRatio}% kalimat yang melebihi 22 kata (batas ideal <= 25%).`,
      'Ritme kalimat enak dibaca dan mudah dipindai di layar mobile.');
  } else if (longSentenceRatio <= 40) {
    readEarned += 15;
    addCheck('readability', 'sentence_length', 'Panjang Kalimat', 'warning', 'medium',
      `${longSentenceRatio}% kalimat melebihi 22 kata.`,
      'Pecah beberapa kalimat panjang menjadi dua kalimat pendek agar pembaca tidak lelah.',
      'ai_readability');
  } else {
    readEarned += 7;
    addCheck('readability', 'sentence_length', 'Panjang Kalimat', 'problem', 'high',
      `${longSentenceRatio}% kalimat terlalu panjang (> 22 kata).`,
      'Sederhanakan struktur kalimat kompleks menjadi kalimat aktif ringkas.',
      'ai_readability');
  }

  // 2b. Paragraph length (20 pts)
  const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).filter(Boolean).length > 130);
  if (paragraphs.length === 0) {
    addCheck('readability', 'paragraph_length', 'Panjang Paragraf', 'problem', 'medium',
      'Struktur paragraf HTML (<p>) belum terdeteksi.',
      'Gunakan blok paragraf 2–4 kalimat per blok.');
  } else if (longParagraphs.length === 0) {
    readEarned += 20;
    addCheck('readability', 'paragraph_length', 'Panjang Paragraf', 'good', 'low',
      `Semua ${paragraphs.length} paragraf ringkas (<= 130 kata), nyaman dibaca di smartphone.`,
      'Pertahankan variasi panjang paragraf agar visual halaman tidak monoton.');
  } else {
    readEarned += longParagraphs.length <= 2 ? 12 : 5;
    addCheck('readability', 'paragraph_length', 'Panjang Paragraf', 'warning', 'medium',
      `${longParagraphs.length} paragraf melebihi 130 kata ("wall of text").`,
      'Pecah paragraf padat menjadi sub-paragraf atau poin daftar agar mudah dipindai.',
      'ai_readability');
  }

  // 2c. Subheading distribution & H1 hygiene (25 pts)
  let maxWordsWithoutSubheading = 0;
  if (subheadings.length > 0 && wordCount > 0) {
    const sections = contentHtml.split(/<h[23]\b[^>]*>/i).map((sec) => stripHtmlToText(sec).split(/\s+/).filter(Boolean).length);
    maxWordsWithoutSubheading = Math.max(...sections, 0);
  } else {
    maxWordsWithoutSubheading = wordCount;
  }

  if (h1InBody.length > 0) {
    readEarned += 10;
    addCheck('readability', 'h1_in_body', 'Hierarki Heading (H1/H2/H3)', 'warning', 'medium',
      `Ditemukan ${h1InBody.length} tag <h1> di dalam isi konten. Judul utama halaman artikel sudah memakai H1.`,
      'Ubah H1 di dalam isi artikel menjadi H2 agar struktur HTML halaman tetap memiliki satu H1 utama.');
  } else if (wordCount >= 300 && maxWordsWithoutSubheading <= 320 && h2Headings.length >= 2) {
    readEarned += 25;
    addCheck('readability', 'subheading_distribution', 'Distribusi Subheading', 'good', 'low',
      `Artikel memiliki ${h2Headings.length} H2 & ${subheadings.length - h2Headings.length} H3 dengan jeda maksimal ${maxWordsWithoutSubheading} kata.`,
      'Hierarki heading sangat membantu pembaca menemukan informasi cepat dan menghasilkan Daftar Isi otomatis.');
  } else if (subheadings.length >= 1) {
    readEarned += 14;
    addCheck('readability', 'subheading_distribution', 'Distribusi Subheading', 'warning', 'medium',
      `Ada bagian artikel sepanjang ~${maxWordsWithoutSubheading} kata tanpa pemisah subheading (ideal <= 300 kata).`,
      'Sisipkan H2 atau H3 baru untuk memecah bagian teks yang panjang.',
      'ai_headings');
  } else {
    addCheck('readability', 'subheading_distribution', 'Distribusi Subheading', 'problem', 'high',
      'Belum ada pemisah H2/H3 di konten.',
      'Tambahkan minimal 2–4 subheading H2 agar pembaca mudah menavigasi isi artikel.',
      'ai_headings');
  }

  // 2d. Transition Words (15 pts)
  const sentencesWithTransition = sentences.filter((s) => {
    const lower = s.toLowerCase();
    return INDONESIAN_TRANSITIONS.some((t) => lower.includes(t)) || ENGLISH_TRANSITIONS.some((t) => lower.includes(t));
  });
  const transitionRatio = sentences.length > 0 ? Math.round((sentencesWithTransition.length / sentences.length) * 100) : 0;
  if (sentences.length < 5) {
    readEarned += 6;
  } else if (transitionRatio >= 18) {
    readEarned += 15;
    addCheck('readability', 'transition_words', 'Kata Transisi Antarkalimat', 'good', 'low',
      `${transitionRatio}% kalimat menggunakan kata transisi sehingga alur logika terasa mengalir.`,
      'Pertahankan kesinambungan antarparagraf secara alami.');
  } else {
    readEarned += transitionRatio >= 8 ? 9 : 4;
    addCheck('readability', 'transition_words', 'Kata Transisi Antarkalimat', 'warning', 'low',
      `Baru ${transitionRatio}% kalimat menggunakan kata transisi (ideal >= 18–20%).`,
      'Gunakan kata penghubung seperti "namun", "misalnya", "selain itu", atau "artinya" untuk memperjelas hubungan antaride.');
  }

  // 2e. Passive Voice Ratio (15 pts)
  const passiveSentences = sentences.filter((s) => {
    const lower = s.toLowerCase();
    const idTokens = lower.match(/\bdi[a-z]{3,}\b/g) || [];
    const hasIdPassive = idTokens.some((tok) => !NON_PASSIVE_DI_WORDS.has(tok));
    const hasEnPassive = /\b(?:is|are|was|were|been|being)\s+[a-z]{3,}(?:ed|en)\b/i.test(lower);
    return hasIdPassive || hasEnPassive;
  });
  const passiveRatio = sentences.length > 0 ? Math.round((passiveSentences.length / sentences.length) * 100) : 0;
  if (sentences.length === 0) {
    readEarned += 5;
  } else if (passiveRatio <= 22) {
    readEarned += 15;
    addCheck('readability', 'passive_voice', 'Penggunaan Kalimat Aktif', 'good', 'low',
      `Hanya ~${passiveRatio}% kalimat mengandung konstruksi pasif; mayoritas sudah memakai kalimat aktif langsung.`,
      'Kalimat aktif membuat penjelasan teknis lebih tegas dan ringkas.');
  } else {
    readEarned += passiveRatio <= 35 ? 9 : 4;
    addCheck('readability', 'passive_voice', 'Penggunaan Kalimat Aktif', 'warning', 'medium',
      `Sekitar ${passiveRatio}% kalimat menggunakan pola pasif (di-/ter-).`,
      'Ubah sebagian kalimat pasif menjadi kalimat aktif agar lebih lugas.',
      'ai_readability');
  }

  const readabilityScore = Math.max(0, Math.min(100, Math.round((readEarned / readMax) * 100)));

  // ==================== 3. GEO READINESS SCORE (100 pts max) ====================
  // Note: GEO Readiness evaluates structural clarity for AI search parsing; never guarantees AI citations.
  let geoEarned = 0;
  const geoMax = 100;

  // 3a. Direct Answer Opening (20 pts)
  const openingText = paragraphs[0] || first100Words;
  const openingWords = openingText.split(/\s+/).filter(Boolean).length;
  const hasDirectPattern = /\b(adalah|merupakan|berfungsi|memungkinkan|membantu|dirancang|is a|refers to|means)\b/i.test(openingText) || openingWords >= 25;
  if (openingWords >= 25 && openingWords <= 95 && hasDirectPattern) {
    geoEarned += 20;
    addCheck('geo', 'geo_direct_answer', 'Kejelasan Jawaban Pembuka (Direct Answer)', 'good', 'low',
      'Paragraf pembuka ringkas dan langsung menjelaskan inti topik tanpa basa-basi panjang.',
      'Ringkasan langsung memudahkan mesin pencari dan AI search mengekstrak definisi atau jawaban inti.');
  } else {
    geoEarned += openingWords >= 15 ? 10 : 3;
    addCheck('geo', 'geo_direct_answer', 'Kejelasan Jawaban Pembuka', 'warning', 'medium',
      'Paragraf pembuka belum merangkum jawaban atau definisi inti topik secara langsung.',
      'Awali artikel dengan jawaban lugas dalam 2–3 kalimat sebelum masuk ke detail teknis.',
      'ai_intro');
  }

  // 3b. Structured Data Formats: Lists / Tables / Callout (20 pts)
  if (listCount >= 1 && (tableCount >= 1 || calloutCount >= 1)) {
    geoEarned += 20;
    addCheck('geo', 'geo_structure', 'Format Terstruktur (Daftar, Tabel, Ringkasan)', 'good', 'low',
      `Konten memuat ${listCount} daftar berpoin, ${tableCount} tabel, dan ${calloutCount} blok ringkasan/callout.`,
      'Format terstruktur memudahkan AI maupun pembaca membandingkan langkah dan kriteria.');
  } else if (listCount >= 1 || tableCount >= 1 || calloutCount >= 1) {
    geoEarned += 13;
    addCheck('geo', 'geo_structure', 'Format Terstruktur', 'warning', 'low',
      `Baru menggunakan ${listCount} daftar dan ${tableCount} tabel.`,
      'Tambahkan tabel perbandingan atau blok ringkasan langkah bila membahas pilihan teknis.');
  } else {
    geoEarned += 4;
    addCheck('geo', 'geo_structure', 'Format Terstruktur', 'problem', 'medium',
      'Artikel hanya berupa teks paragraf tanpa bullet list, tabel, atau callout ringkasan.',
      'Sajikan poin kunci atau langkah implementasi menggunakan daftar (<ul>/<ol>) atau tabel.');
  }

  // 3c. Entity & Domain Context Clarity (20 pts)
  const lowerAll = `${metaTitle} ${plainText}`.toLowerCase();
  const matchedEntities = ENTITY_TERMS.filter((ent) => lowerAll.includes(ent));
  if (matchedEntities.length >= 4) {
    geoEarned += 20;
    addCheck('geo', 'geo_entities', 'Konteks Entitas & Relevansi Semantik', 'good', 'low',
      `Terdeteksi ${matchedEntities.length} entitas konteks relevan (${matchedEntities.slice(0, 6).join(', ')}).`,
      'Entitas teknologi & lokasi yang konsisten memperkuat pemetaan topik.');
  } else {
    geoEarned += Math.min(14, matchedEntities.length * 4);
    addCheck('geo', 'geo_entities', 'Konteks Entitas & Relevansi Semantik', 'warning', 'medium',
      `Baru ${matchedEntities.length} entitas konteks spesifik yang eksplisit.`,
      'Sebutkan secara spesifik teknologi, standar, atau konteks bisnis Indonesia/1sLabs yang relevan.');
  }

  // 3d. Concrete Factual Signals (Numbers / Specs / References) (20 pts)
  const numericMatches = plainText.match(/\b\d+(?:[.,]\d+)?(?:\s?(?:%|ms|detik|menit|jam|hari|bulan|tahun|GB|MB|KB|px|kata|karakter))?\b/gi) || [];
  if (numericMatches.length >= 3 && (externalLinks.length >= 1 || internalLinks.length >= 1)) {
    geoEarned += 20;
    addCheck('geo', 'geo_facts', 'Data Konkret & Rujukan Sumber', 'good', 'low',
      `Terdapat ${numericMatches.length} angka/spesifikasi konkret disertai tautan rujukan.`,
      'Pastikan seluruh metrik dan rujukan akurat serta dapat diverifikasi.');
  } else if (numericMatches.length >= 1) {
    geoEarned += 11;
    addCheck('geo', 'geo_facts', 'Data Konkret & Rujukan Sumber', 'warning', 'medium',
      'Baru sedikit parameter terukur atau sumber rujukan yang dicantumkan.',
      'Lengkapi dengan parameter teknis, batasan ukur, atau tautan dokumentasi resmi yang faktual.');
  } else {
    geoEarned += 4;
    addCheck('geo', 'geo_facts', 'Data Konkret & Rujukan Sumber', 'warning', 'medium',
      'Belum ditemukan parameter numerik atau spesifikasi terukur di konten.',
      'Hindari pernyataan umum seperti "sangat cepat"; ganti dengan tolok ukur atau syarat teknis konkret.');
  }

  // 3e. FAQ Section & Author E-E-A-T Attribution (20 pts)
  const hasFaqHeading = subheadings.some((h) => /\b(faq|pertanyaan|tanya jawab)\b/i.test(h.text));
  const hasFaq = faqItems.length >= 2 || hasFaqHeading;
  if (hasFaq && authorName) {
    geoEarned += 20;
    addCheck('geo', 'geo_faq_eeat', 'FAQ & Atribusi Penulis (E-E-A-T)', 'good', 'low',
      `Bagian FAQ tersedia (${faqItems.length > 0 ? `${faqItems.length} tanya-jawab terstruktur Schema FAQPage` : 'heading FAQ terdeteksi'}) dan atribusi penulis "${authorName}" tercantum.`,
      'Struktur FAQ + atribusi penulis meningkatkan kejelasan konteks bagi pengguna & mesin pencari (tidak menjamin kutipan AI).');
  } else if (hasFaq || authorName) {
    geoEarned += 11;
    addCheck('geo', 'geo_faq_eeat', 'FAQ & Atribusi Penulis (E-E-A-T)', 'warning', 'medium',
      `${!hasFaq ? 'Belum ada bagian FAQ / FAQ Schema. ' : ''}${!authorName ? 'Nama penulis belum diisi.' : ''}`,
      'Tambahkan 3–5 pertanyaan umum beserta jawaban ringkas serta cantumkan nama penulis/tim ahli 1sLabs.',
      !hasFaq ? 'ai_faq' : null);
  } else {
    addCheck('geo', 'geo_faq_eeat', 'FAQ & Atribusi Penulis (E-E-A-T)', 'problem', 'high',
      'Tidak ada bagian FAQ terstruktur dan nama penulis masih kosong.',
      'Buat bagian FAQ untuk menjawab pertanyaan turunannya dan lengkapi profil penulis.',
      'ai_faq');
  }

  const geoScore = Math.max(0, Math.min(100, Math.round((geoEarned / geoMax) * 100)));

  const composite = Math.round(seoScore * 0.45 + readabilityScore * 0.30 + geoScore * 0.25);
  let healthStatus = 'poor';
  if (seoScore >= 75 && readabilityScore >= 70 && composite >= 75) {
    healthStatus = 'good';
  } else if (composite >= 50) {
    healthStatus = 'needs_improvement';
  }

  return {
    seo_score: seoScore,
    readability_score: readabilityScore,
    geo_score: geoScore,
    composite_score: composite,
    health_status: healthStatus,
    metrics: {
      word_count: wordCount,
      reading_time: Math.max(1, Math.ceil(wordCount / 200)),
      sentence_count: sentences.length,
      long_sentence_ratio: longSentenceRatio,
      paragraph_count: paragraphs.length,
      long_paragraph_count: longParagraphs.length,
      h1_in_body_count: h1InBody.length,
      h2_count: h2Headings.length,
      subheading_count: subheadings.length,
      max_words_without_subheading: maxWordsWithoutSubheading,
      transition_ratio: transitionRatio,
      passive_ratio: passiveRatio,
      title_length: titleLen,
      title_pixel_width: titlePixels,
      meta_description_length: descLen,
      slug_length: slug.length,
      keyphrase_count: keyphraseCount,
      keyphrase_density: keyphraseDensity,
      internal_links_count: internalLinks.length,
      external_links_count: externalLinks.length,
      content_images_count: imgMatches.length,
      images_missing_alt_count: imagesMissingAlt.length,
      list_count: listCount,
      table_count: tableCount,
      callout_count: calloutCount,
      faq_count: faqItems.length,
      detected_intent: keyphraseIntent,
      matched_entities: matchedEntities
    },
    links: {
      internal: internalLinks,
      external: externalLinks
    },
    headings: subheadings,
    checks
  };
}

module.exports = {
  analyzeArticle,
  estimatePixelWidth,
  countKeyphraseOccurrences
};

