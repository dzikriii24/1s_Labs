const { query } = require('../../db');
const { sanitizeArticleHtml, stripHtmlToText, slugify } = require('./blogSchema.service');
const { analyzeArticle } = require('./seoAnalyzer.service');

const GEMINI_API_KEY = process.env.GEMINI_API || process.env.GEMINI_API_KEY || '';
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash'
];

const AISLOP_RULES = `
ATURAN PENULISAN KETAT (ANTI-AI-SLOP & AKURASI):
1. DILARANG memakai frasa klise AI seperti: "di era digital yang terus berkembang", "tidak dapat dipungkiri", "mari kita telusuri", "bagaikan dua sisi mata uang", "revolusioner", "game changer", "solusi terbaik di kelasnya", "kesimpulannya," sebagai pembuka penutup yang hambar.
2. Gunakan kalimat aktif, panjang kalimat bervariasi (campur kalimat 7-12 kata dengan 14-20 kata), maksimal 1 em-dash per 500 kata.
3. JANGAN PERNAH mengarang harga, angka statistik palsu, testimoni pelanggan, jumlah proyek fiktif, atau klaim SLA 1sLabs.
4. Informasi faktual 1sLabs: penyedia layanan software custom pay-once, managed web hosting, integrasi sistem & maintenance web untuk bisnis di Indonesia (website: https://1slabs.my.id, dokumentasi: /docs, layanan hosting: /hosting, konsultasi jadwal: /schedule).
5. Gunakan Bahasa Indonesia teknis yang jernih, lugas, dan profesional (kecuali jika artikel aslinya berbahasa Inggris, ikuti bahasa artikel).
`;

async function callGeminiJson({ prompt, systemInstruction = '', purpose = 'blog_seo_ai', temperature = 0.35 }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API belum dikonfigurasi pada environment backend.');
  }

  const startTime = Date.now();
  const modelsToTry = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));
  let lastError = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`;
        const body = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature
          }
        };
        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 429 || response.status >= 500) {
            throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 220)}`);
          }
          // 404 model unavailable -> break attempt loop and try fallback model
          lastError = new Error(`Model ${currentModel} error ${response.status}: ${errText.slice(0, 220)}`);
          break;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawText) {
          throw new Error('Respons Gemini kosong.');
        }

        let parsed;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
          parsed = JSON.parse(cleaned);
        }

        const usage = data.usageMetadata || {};
        const latencyMs = Date.now() - startTime;
        query(
          `INSERT INTO marketing_ai_logs
           (model, purpose, company_id, prompt_tokens, completion_tokens, input_snapshot, output_snapshot, status, latency_ms)
           VALUES (?, ?, NULL, ?, ?, ?, ?, 'success', ?)`,
          [
            currentModel,
            purpose,
            usage.promptTokenCount || 0,
            usage.candidatesTokenCount || 0,
            prompt.slice(0, 1000),
            rawText.slice(0, 1800),
            latencyMs
          ]
        ).catch(() => {});

        return {
          data: parsed,
          modelUsed: currentModel,
          usage,
          latencyMs
        };
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi Gemini AI.');
}

/**
 * A. Full AI SEO & GEO Audit returning structured insights.
 */
async function runAiSeoAudit(article, deterministicResult = null) {
  const analysis = deterministicResult || analyzeArticle(article);
  const plainText = stripHtmlToText(article.content || '');

  const systemInstruction = `Anda adalah Senior Technical SEO & GEO Strategist untuk 1sLabs Indonesia (https://1slabs.my.id).
${AISLOP_RULES}
Berikan evaluasi objektif dan teknis berdasarkan data artikel nyata. Jangan menjanjikan peringkat #1 atau jaminan kutipan AI.`;

  const prompt = `Lakukan audit SEO On-Page, Readability, Search Intent, dan GEO Readiness terhadap artikel 1sLabs berikut.

DATA ARTIKEL:
- Judul: ${article.title || '(Kosong)'}
- Meta Title: ${article.meta_title || '(Kosong)'}
- Meta Description: ${article.meta_description || '(Kosong)'}
- Slug: /blog/${article.slug || ''}
- Focus Keyphrase: ${article.focus_keyphrase || '(Belum diatur)'}
- Metrik Deterministik Saat Ini:
  SEO Score: ${analysis.seo_score}/100
  Readability Score: ${analysis.readability_score}/100
  GEO Score: ${analysis.geo_score}/100
  Word Count: ${analysis.metrics.word_count} kata
  Keyphrase Density: ${analysis.metrics.keyphrase_density}%
  Internal Links: ${analysis.metrics.internal_links_count}
  External Links: ${analysis.metrics.external_links_count}

CUPLIKAN KONTEN:
${plainText.slice(0, 7500)}

Keluarkan JSON dengan struktur persis:
{
  "summary": "Ringkasan audit 2-3 kalimat spesifik pada artikel ini",
  "search_intent_fit": {
    "detected_intent": "informational|commercial|transactional|navigational",
    "alignment_rating": "kuat|cukup|lemah",
    "note": "Penjelasan singkat kesesuaian judul dan isi terhadap intent pengguna"
  },
  "keyword_opportunities": ["3-5 variasi long-tail/LSI keyphrase spesifik"],
  "readability_findings": ["2-4 temuan konkret struktur kalimat/paragraf/heading"],
  "geo_readiness_insights": ["2-4 saran agar konten lebih mudah dipahami AI search tanpa mengarang fakta"],
  "prioritized_actions": [
    {
      "priority": "critical|high|medium|low",
      "area": "SEO Title|Meta|Konten|Heading|Internal Link|GEO|FAQ",
      "issue": "Masalah spesifik",
      "fix": "Langkah perbaikan konkret"
    }
  ],
  "faq_suggestions": [
    { "question": "Pertanyaan relevan pengguna", "answer": "Jawaban ringkas dan faktual" }
  ]
}`;

  const res = await callGeminiJson({ prompt, systemInstruction, purpose: 'blog_seo_audit', temperature: 0.25 });
  return {
    audit: res.data,
    deterministic: analysis,
    model: res.modelUsed,
    latencyMs: res.latencyMs
  };
}

/**
 * B. Granular AI Writing Assistant tasks.
 */
async function runAiAssist({ task, article = {}, existingArticles = [], extraContext = '' }) {
  const plainText = stripHtmlToText(article.content || '');
  const title = article.title || 'Artikel 1sLabs';
  const focusKeyphrase = article.focus_keyphrase || '';

  const systemInstruction = `Anda adalah Senior Editorial & Technical SEO Copywriter 1sLabs (https://1slabs.my.id).
${AISLOP_RULES}`;

  let prompt = '';
  switch (task) {
    case 'titles':
      prompt = `Buat 5 pilihan SEO Title (45–58 karakter, <= 580px) untuk artikel berikut.
Judul saat ini: "${title}"
Focus Keyphrase: "${focusKeyphrase}"
Ringkasan isi: ${plainText.slice(0, 2200)}
Letakkan kata kunci utama di bagian awal bila memungkinkan, hindari clickbait berlebihan.
Keluarkan JSON: { "titles": [ { "title": "...", "char_count": 52, "rationale": "..." } ] }`;
      break;

    case 'descriptions':
      prompt = `Buat 4 variasi Meta Description (130–155 karakter) yang mengandung focus keyphrase "${focusKeyphrase || title}" secara alami dan memberi nilai jelas bagi pembaca.
Judul: "${title}"
Ringkasan isi: ${plainText.slice(0, 2200)}
Keluarkan JSON: { "descriptions": [ { "description": "...", "char_count": 148, "rationale": "..." } ] }`;
      break;

    case 'keyphrases':
      prompt = `Analisa topik artikel berikut dan rekomendasikan 1 Focus Keyphrase utama paling potensial untuk audiens bisnis/developer Indonesia + 5 Secondary/LSI keyphrases.
Judul: "${title}"
Konten: ${plainText.slice(0, 3000)}
Keluarkan JSON: { "primary_keyphrase": "...", "secondary_keyphrases": ["..."], "search_intent": "informational|commercial|transactional", "rationale": "..." }`;
      break;

    case 'intro':
      prompt = `Tulis ulang paragraf pembuka artikel (55–85 kata dalam HTML <p>...</p>) agar langsung menjawab kebutuhan pembaca dan menyertakan focus keyphrase "${focusKeyphrase}" di kalimat pertama atau kedua secara natural.
Judul: "${title}"
Pembuka saat ini: ${plainText.slice(0, 1000)}
Keluarkan JSON: { "intro_html": "<p>...</p>", "notes": "..." }`;
      break;

    case 'faq':
      prompt = `Buat 4 sampai 5 pasangan Tanya-Jawab (FAQ) yang relevan untuk pembaca Indonesia dan memperjelas konteks GEO berdasarkan artikel ini. Jangan mengarang klaim harga atau SLA fiktif.
Judul: "${title}"
Focus Keyphrase: "${focusKeyphrase}"
Konten: ${plainText.slice(0, 4500)}
Keluarkan JSON: {
  "faqs": [ { "question": "...", "answer": "..." } ],
  "faq_html": "<h2>Pertanyaan Umum (FAQ)</h2>..."
}`;
      break;

    case 'headings':
      prompt = `Susun ulang kerangka subheading H2 dan H3 agar alur artikel logis, mudah dipindai, dan menyisipkan "${focusKeyphrase}" secara natural di 1-2 H2.
Judul: "${title}"
Konten saat ini: ${plainText.slice(0, 3500)}
Keluarkan JSON: { "outline": [ { "tag": "h2|h3", "heading": "...", "purpose": "..." } ], "notes": "..." }`;
      break;

    case 'keyword_distribution':
      prompt = `Evaluasi penempatan kata kunci "${focusKeyphrase}" dalam artikel berikut dan berikan 3–5 saran kalimat penyisipan natural agar kepadatan berada di 0.6%–2.2% tanpa merusak alur baca.
Konten: ${plainText.slice(0, 4500)}
Keluarkan JSON: { "suggestions": [ { "location": "...", "suggested_sentence": "...", "reason": "..." } ] }`;
      break;

    case 'readability':
      prompt = `Periksa paragraf panjang atau kalimat pasif dari cuplikan konten di bawah dan berikan versi perbaikan yang lebih ringkas, aktif, dan terstruktur (<p> / <ul>).
Konten: ${(article.content || '').slice(0, 5000)}
Keluarkan JSON: { "improved_snippets": [ { "issue": "...", "improved_html": "..." } ], "tips": ["..."] }`;
      break;

    case 'alt_text':
      prompt = `Buat Alt Text gambar yang akurat, deskriptif (maksimal 120 karakter), ramah screen-reader, dan relevan dengan topik artikel tanpa menjejalkan kata kunci paksa.
Judul artikel: "${title}"
Focus keyphrase: "${focusKeyphrase}"
Konteks / URL / caption gambar: "${extraContext || article.featured_image || 'Ilustrasi artikel teknologi 1sLabs'}"
Keluarkan JSON: { "alt_text": "...", "alternatives": ["...", "..."] }`;
      break;

    case 'internal_links': {
      const candidateList = [
        { title: 'Managed Web Hosting 1sLabs', url: '/hosting' },
        { title: 'Pusat Dokumentasi & Panduan Teknis 1sLabs', url: '/docs' },
        { title: 'Konsultasi & Jadwalkan Meeting Engineering', url: '/schedule' },
        { title: 'Layanan Pembuatan Website & Aplikasi Custom', url: '/service/website-development' },
        ...(existingArticles || []).map((a) => ({
          title: a.title,
          url: `/blog/${a.slug}`,
          focus_keyphrase: a.focus_keyphrase || ''
        }))
      ];
      prompt = `Rekomendasikan 3–5 internal link yang paling relevan untuk disisipkan di dalam artikel ini.
HANYA pilih URL dari daftar target valid di bawah ini!
Judul Artikel Sumber: "${title}"
Isi Singkat: ${plainText.slice(0, 3000)}
Daftar Halaman & Artikel Target Valid:
${JSON.stringify(candidateList, null, 2)}

Keluarkan JSON: {
  "recommendations": [
    { "target_title": "...", "target_url": "...", "anchor_text": "...", "context_sentence": "..." }
  ]
}`;
      break;
    }

    case 'conclusion':
      prompt = `Tulis paragraf penutup (conclusion) yang kuat dan natural (60–95 kata dalam HTML <p>...</p>) untuk artikel ini, berisi rangkuman poin inti dan ajakan bertindak yang halus sesuai konteks 1sLabs (tanpa bahasa promosi berlebihan).
Judul: "${title}"
Focus Keyphrase: "${focusKeyphrase}"
Ringkasan artikel: ${plainText.slice(-2000)}
Keluaran JSON: { "conclusion_html": "<p>...</p>", "notes": "..." }`;
      break;

    case 'improve_selection':
    case 'rewrite_selection':
    case 'expand_selection':
    case 'summarize_selection':
    case 'fix_grammar':
    case 'improve_readability_selection': {
      const targetText = String(extraContext || '').trim();
      if (!targetText) {
        throw new Error('Pilih teks atau paragraf yang ingin diproses AI terlebih dahulu.');
      }
      const modeInstructions = {
        improve_selection:
          'Tingkatkan kejelasan, alur, ketajaman argumen, dan kualitas penulisan profesional HANYA untuk teks pilihan ini tanpa mengubah maksud atau fakta aslinya.',
        rewrite_selection:
          'Tulis ulang teks pilihan berikut dengan gaya kalimat aktif yang lebih segar, lugas, dan mengalir secara natural.',
        expand_selection:
          'Kembangkan teks pilihan berikut menjadi penjelasan yang lebih kaya konteks dan contoh implementasi nyata (tambahkan 1-2 paragraf singkat HTML <p>...</p> atau <ul>...</ul> bila relevan, TANPA mengarang statistik atau harga palsu).',
        summarize_selection:
          'Ringkas teks pilihan berikut agar lebih padat, langsung pada poin utama, dan mudah dipindai pembaca.',
        fix_grammar:
          'Perbaiki ejaan (KBBI/EYD V bila Bahasa Indonesia atau grammar yang tepat bila Bahasa Inggris), tanda baca, dan struktur kalimat pada teks pilihan berikut tanpa mengubah gaya dasar penulis.',
        improve_readability_selection:
          'Pecah kalimat terlalu panjang, ubah kalimat pasif yang kaku menjadi kalimat aktif, dan perkuat kata transisi pada teks pilihan berikut agar lebih mudah dibaca.'
      };
      prompt = `${modeInstructions[task]}
KONTEKS ARTIKEL (hanya sebagai referensi nada & topik — JANGAN menulis ulang keseluruhan artikel!):
- Judul Artikel: "${title}"
- Focus Keyphrase: "${focusKeyphrase || '(tidak ditentukan)'}"

TEKS YANG DIPILIH PENGGUNA (ubah HANYA bagian ini):
"""
${targetText.slice(0, 4500)}
"""

Aturan keluaran:
- "improved_html" berisi hasil teks perbaikan dalam HTML bersih (<p>...</p>, atau <p> + <ul> bila sesuai, jangan gunakan <h1>).
- "improved_text" berisi versi plain text bersih dari hasil perbaikan.
- "explanation" menjelaskan 1 kalimat singkat apa yang ditingkatkan.
Keluaran JSON persis:
{
  "original_text": ${JSON.stringify(targetText.slice(0, 4500))},
  "improved_html": "<p>...</p>",
  "improved_text": "...",
  "explanation": "..."
}`;
      break;
    }

    case 'generate_heading_selection': {
      const targetText = String(extraContext || plainText.slice(0, 1200)).trim();
      prompt = `Sarankan 4 pilihan subheading (h2 atau h3) yang jelas, deskriptif, dan ramah SEO untuk bagian teks berikut.
Judul Artikel: "${title}"
Focus Keyphrase: "${focusKeyphrase}"
Teks / Bagian yang Dibuatkan Subheading:
"""
${targetText.slice(0, 2500)}
"""
Keluaran JSON: {
  "headings": [
    { "tag": "h2", "text": "...", "rationale": "..." }
  ]
}`;
      break;
    }

    default:
      throw new Error(`Task AI Assistant "${task}" tidak dikenal.`);
  }

  const res = await callGeminiJson({ prompt, systemInstruction, purpose: `blog_ai_${task}`, temperature: 0.35 });
  const data = res.data || {};
  if (typeof data.intro_html === 'string') data.intro_html = sanitizeArticleHtml(data.intro_html);
  if (typeof data.conclusion_html === 'string') data.conclusion_html = sanitizeArticleHtml(data.conclusion_html);
  if (typeof data.improved_html === 'string') data.improved_html = sanitizeArticleHtml(data.improved_html);
  return {
    task,
    result: data,
    model: res.modelUsed,
    latencyMs: res.latencyMs
  };
}

/**
 * C. One-Click Full SEO & GEO Optimization with Before/After Diff & Content Preservation Guard.
 */
async function runOneClickOptimize(article, existingArticles = []) {
  const beforeAnalysis = analyzeArticle(article);
  const originalContent = String(article.content || '');
  const originalPlain = stripHtmlToText(originalContent);
  const originalWordCount = originalPlain ? originalPlain.split(/\s+/).filter(Boolean).length : 0;

  // Collect all <img> tags to ensure none are accidentally deleted by LLM output
  const originalImages = [];
  const imgRegex = /<img\b[^>]*src=(["'])([^"']+)\1[^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(originalContent)) !== null) {
    originalImages.push({ fullTag: m[0], src: m[2] });
  }

  const validTargets = [
    { title: 'Managed Web Hosting 1sLabs', url: '/hosting' },
    { title: 'Pusat Dokumentasi 1sLabs', url: '/docs' },
    { title: 'Jadwalkan Konsultasi Engineering', url: '/schedule' },
    ...(existingArticles || [])
      .filter((a) => Number(a.id) !== Number(article.id) && a.slug)
      .slice(0, 15)
      .map((a) => ({ title: a.title, url: `/blog/${a.slug}` }))
  ];

  const systemInstruction = `Anda adalah Principal SEO & Technical Editor 1sLabs.
Tugas Anda mengoptimalkan metadata dan struktur HTML artikel secara presisi TANPA menghapus isi penting, fakta, contoh kode, atau tag <img> yang sudah ada.
${AISLOP_RULES}
ATURAN KETAT OPTIMASI:
- Pertahankan seluruh makna, argumen, dan struktur bagian utama artikel asli (panjang konten setelah optimasi tidak boleh menyusut drastis).
- Jangan gunakan tag <h1> di dalam content HTML; gunakan <h2> dan <h3>.
- Pertahankan seluruh URL gambar <img> yang sudah ada dan lengkapi atribut alt="" yang relevan bila masih kosong.
- Boleh menyisipkan 1-3 internal link natural HANYA ke URL dari daftar target valid yang diberikan.
- Boleh merapikan paragraf pembuka agar langsung menjawab topik, memperjelas H2/H3, menambah 1 blok callout ringkasan (<div class="callout-box"><strong>Ringkasan Praktis:</strong> ...</div>) atau FAQ di akhir jika belum ada.
- Kembalikan HANYA JSON valid sesuai skema.`;

  const prompt = `Optimalkan artikel berikut agar skor SEO, Readability, dan GEO Readiness meningkat secara terukur.

KEADAAN SAAT INI:
- SEO Score: ${beforeAnalysis.seo_score}, Readability: ${beforeAnalysis.readability_score}, GEO: ${beforeAnalysis.geo_score}
- Title: ${article.title || ''}
- Slug: ${article.slug || ''}
- Excerpt: ${article.excerpt || ''}
- Meta Title: ${article.meta_title || ''}
- Meta Description: ${article.meta_description || ''}
- Focus Keyphrase: ${article.focus_keyphrase || ''}
- Featured Image Alt: ${article.featured_image_alt || ''}

MASALAH YANG TERDETEKSI ANALYZER:
${beforeAnalysis.checks
  .filter((c) => c.status !== 'good')
  .map((c) => `- [${c.category.toUpperCase()} / ${c.priority}] ${c.title}: ${c.detail} -> ${c.recommendation}`)
  .join('\n')}

DAFTAR TARGET INTERNAL LINK VALID:
${JSON.stringify(validTargets, null, 2)}

KONTEN HTML ASLI (${originalWordCount} kata):
${originalContent.slice(0, 16000)}

Keluarkan JSON:
{
  "title": "Judul artikel jelas & menarik",
  "meta_title": "SEO Title optimal 45-60 karakter dengan focus keyphrase di awal",
  "meta_description": "Meta description 128-155 karakter dengan focus keyphrase & manfaat konkret",
  "focus_keyphrase": "Kata kunci utama 2-5 kata",
  "excerpt": "Ringkasan artikel 1-2 kalimat padat (110-170 karakter)",
  "featured_image_alt": "Alt text gambar utama maksimal 120 karakter",
  "optimized_content": "Konten HTML lengkap yang sudah dirapikan (h2/h3, paragraf pendek, transisi jelas, internal link natural, pertahankan semua isi & gambar asli)",
  "faq_items": [
    { "question": "Pertanyaan relevan?", "answer": "Jawaban singkat & faktual." }
  ],
  "optimization_notes": ["Daftar ringkas perubahan konkret yang dilakukan"]
}`;

  const res = await callGeminiJson({
    prompt,
    systemInstruction,
    purpose: 'blog_one_click_optimize',
    temperature: 0.28
  });

  const payload = res.data || {};
  let optimizedContent = sanitizeArticleHtml(String(payload.optimized_content || originalContent));

  // Content Preservation Guard 1: ensure minimum word preservation if original had substance
  const optimizedWords = stripHtmlToText(optimizedContent).split(/\s+/).filter(Boolean).length;
  let guardWarning = null;
  if (originalWordCount >= 120 && optimizedWords < originalWordCount * 0.65) {
    optimizedContent = originalContent;
    guardWarning = `Content Preservation Guard menahan perubahan HTML karena output AI terlalu singkat (${optimizedWords} vs ${originalWordCount} kata). Metadata & FAQ tetap disiapkan.`;
  } else {
    // Content Preservation Guard 2: ensure every original <img> src still survives
    for (const img of originalImages) {
      if (!optimizedContent.includes(img.src)) {
        optimizedContent += `\n<figure>${img.fullTag}</figure>`;
      }
    }
  }

  const faqItems = Array.isArray(payload.faq_items)
    ? payload.faq_items.filter((f) => f && f.question && f.answer).slice(0, 6)
    : [];

  const candidateArticle = {
    ...article,
    title: String(payload.title || article.title || '').trim(),
    slug: article.slug || slugify(payload.title || article.title || ''),
    excerpt: String(payload.excerpt || article.excerpt || '').trim(),
    meta_title: String(payload.meta_title || article.meta_title || payload.title || '').trim(),
    meta_description: String(payload.meta_description || article.meta_description || '').trim(),
    focus_keyphrase: String(payload.focus_keyphrase || article.focus_keyphrase || '').trim(),
    featured_image_alt: String(payload.featured_image_alt || article.featured_image_alt || '').trim(),
    content: optimizedContent,
    faq_items: faqItems,
    faq_schema_json: faqItems.length > 0 ? JSON.stringify(faqItems) : article.faq_schema_json
  };

  const afterAnalysis = analyzeArticle(candidateArticle);

  const trackedFields = [
    { field: 'title', label: 'Judul Artikel' },
    { field: 'focus_keyphrase', label: 'Focus Keyphrase' },
    { field: 'meta_title', label: 'SEO Title' },
    { field: 'meta_description', label: 'Meta Description' },
    { field: 'excerpt', label: 'Excerpt' },
    { field: 'featured_image_alt', label: 'Featured Image Alt' }
  ];

  const fieldDiffs = trackedFields
    .map(({ field, label }) => ({
      field,
      label,
      before: String(article[field] || ''),
      after: String(candidateArticle[field] || ''),
      changed: String(article[field] || '').trim() !== String(candidateArticle[field] || '').trim()
    }));

  return {
    proposed: {
      title: candidateArticle.title,
      meta_title: candidateArticle.meta_title,
      meta_description: candidateArticle.meta_description,
      focus_keyphrase: candidateArticle.focus_keyphrase,
      excerpt: candidateArticle.excerpt,
      featured_image_alt: candidateArticle.featured_image_alt,
      content: candidateArticle.content,
      faq_items: faqItems
    },
    before: {
      seo_score: beforeAnalysis.seo_score,
      readability_score: beforeAnalysis.readability_score,
      geo_score: beforeAnalysis.geo_score,
      word_count: beforeAnalysis.metrics.word_count,
      h2_count: beforeAnalysis.metrics.h2_count,
      internal_links_count: beforeAnalysis.metrics.internal_links_count,
      faq_count: beforeAnalysis.metrics.faq_count
    },
    after: {
      seo_score: afterAnalysis.seo_score,
      readability_score: afterAnalysis.readability_score,
      geo_score: afterAnalysis.geo_score,
      word_count: afterAnalysis.metrics.word_count,
      h2_count: afterAnalysis.metrics.h2_count,
      internal_links_count: afterAnalysis.metrics.internal_links_count,
      faq_count: afterAnalysis.metrics.faq_count,
      checks: afterAnalysis.checks
    },
    fieldDiffs,
    contentChanged: originalContent.trim() !== candidateArticle.content.trim(),
    optimizationNotes: Array.isArray(payload.optimization_notes) ? payload.optimization_notes : [],
    guardWarning,
    model: res.modelUsed,
    latencyMs: res.latencyMs
  };
}

/**
 * D. Generate Content Strategy & Content Gap Ideas for 1sLabs.
 */
async function generateAiContentIdeas({ clusters = [], gscQueries = [], existingTitles = [], focusTopic = '' }) {
  const systemInstruction = `Anda adalah Content Strategist untuk 1sLabs Indonesia (software engineering custom, pay-once business apps, managed web hosting, technical SEO & maintenance web).
${AISLOP_RULES}
Berikan ide artikel bernilai bisnis & teknis tinggi yang realistis dan belum terduplikasi dengan judul yang sudah ada.`;

  const prompt = `Rancang 5 ide artikel strategis untuk blog 1sLabs (/blog).

TOPIK FOKUS TAMBAHAN: ${focusTopic || 'Sesuaikan dengan pilar klaster & peluang kueri 1sLabs'}

TOPIC CLUSTERS YANG ADA:
${JSON.stringify(clusters.map((c) => ({ id: c.id, name: c.name, target_keyword: c.target_keyword })), null, 2)}

KUERI DARI GOOGLE SEARCH CONSOLE (bila ada):
${JSON.stringify(gscQueries.slice(0, 15).map((q) => ({ query: q.query_text, clicks: q.clicks, impressions: q.impressions, position: q.position })), null, 2)}

JUDUL ARTIKEL YANG SUDAH ADA (HINDARI DUPLIKASI):
${existingTitles.slice(0, 40).join('\n- ')}

Keluarkan JSON:
{
  "ideas": [
    {
      "cluster_id": null,
      "title": "Judul artikel spesifik dan bernilai tinggi",
      "target_keyword": "Kata kunci utama",
      "search_intent": "informational|commercial|transactional",
      "priority": "high|medium|low",
      "rationale": "Alasan strategis kenapa artikel ini perlu dibuat",
      "outline": ["H2 pertama...", "H2 kedua...", "H2 ketiga..."]
    }
  ]
}`;

  const res = await callGeminiJson({ prompt, systemInstruction, purpose: 'blog_content_ideas', temperature: 0.45 });
  return {
    ideas: Array.isArray(res.data?.ideas) ? res.data.ideas : [],
    model: res.modelUsed
  };
}

module.exports = {
  runAiSeoAudit,
  runAiAssist,
  runOneClickOptimize,
  generateAiContentIdeas
};

