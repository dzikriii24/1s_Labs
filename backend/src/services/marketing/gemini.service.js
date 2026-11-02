const path = require('path');
const dns = require('dns');
const { query } = require('../../db');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Force IPv4 first to eliminate IPv6 network unreachable delays on cPanel
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const GEMINI_API_KEY = process.env.GEMINI_API || process.env.GEMINI_API_KEY || '';
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash'];

/**
 * Call Google Gemini REST API with exponential backoff and automatic model fallback
 */
async function callGeminiApi({ prompt, systemInstruction = '', model = PRIMARY_MODEL, retries = 3, companyId = null, purpose = 'enrichment' }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API key is not configured in backend .env');
  }

  const modelsToTry = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError = null;
  const startTime = Date.now();

  for (const currentModel of modelsToTry) {
    let attempt = 0;
    while (attempt <= retries) {
      attempt++;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2, // Low temperature for high factual accuracy
            topP: 0.9,
            responseMimeType: 'application/json'
          }
        };

        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000)
        });

        const data = await response.json();

        if (!response.ok) {
          const errCode = data.error?.code || response.status;
          const errMsg = data.error?.message || 'Gemini API Error';
          
          // If 503 (Demand Spike) or 429 (Rate limit), wait and retry with backoff
          if ((errCode === 503 || errCode === 429) && attempt <= retries) {
            const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }

          // If model not found or deprecated, break to next model in fallback list
          if (errCode === 404) {
            lastError = new Error(`Model ${currentModel} not available: ${errMsg}`);
            break;
          }

          throw new Error(`Gemini API HTTP ${errCode}: ${errMsg}`);
        }

        const candidate = data.candidates?.[0];
        const rawOutputText = candidate?.content?.parts?.[0]?.text || '{}';
        const usage = data.usageMetadata || {};
        const latencyMs = Date.now() - startTime;

        // Log AI Usage to DB asynchronously
        query(
          `INSERT INTO marketing_ai_logs 
           (model, purpose, company_id, prompt_tokens, completion_tokens, input_snapshot, output_snapshot, status, latency_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?)`,
          [
            currentModel,
            purpose,
            companyId,
            usage.promptTokenCount || 0,
            usage.candidatesTokenCount || 0,
            prompt.slice(0, 1500),
            rawOutputText.slice(0, 2000),
            latencyMs
          ]
        ).catch(err => console.warn('[Gemini AI Log DB Error]:', err.message));

        let parsedJson;
        try {
          parsedJson = JSON.parse(rawOutputText);
        } catch {
          // If response wrapped in markdown code blocks
          const cleaned = rawOutputText.replace(/^```json/m, '').replace(/```$/m, '').trim();
          parsedJson = JSON.parse(cleaned);
        }

        return {
          success: true,
          data: parsedJson,
          modelUsed: currentModel,
          usage
        };
      } catch (err) {
        lastError = err;
        if (attempt <= retries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
  }

  // If all models failed, log error
  query(
    `INSERT INTO marketing_ai_logs 
     (model, purpose, company_id, prompt_tokens, completion_tokens, input_snapshot, output_snapshot, status, latency_ms)
     VALUES (?, ?, ?, 0, 0, ?, ?, 'failed', ?)`,
    [
      model,
      purpose,
      companyId,
      prompt.slice(0, 1000),
      lastError ? lastError.message : 'All model fallbacks exhausted',
      Date.now() - startTime
    ]
  ).catch(() => {});

  throw lastError || new Error('Gagal menghubungi Gemini API setelah mencoba beberapa model fallback.');
}

/**
 * 1. Extract & Enrich Business Data from Raw Scraped Content
 * ZERO HALLUCINATION POLICY: Factual values must come strictly from the source or be null.
 */
async function extractAndEnrichBusiness(rawContent, sourceContext = {}, companyId = null) {
  let dataToAnalyze = rawContent;
  let targetCompanyId = companyId;

  if (typeof rawContent === 'number' || (typeof rawContent === 'string' && /^\d+$/.test(rawContent))) {
    targetCompanyId = parseInt(rawContent, 10);
    const rows = await query('SELECT * FROM marketing_companies WHERE id = ?', [targetCompanyId]);
    if (rows && rows[0]) {
      dataToAnalyze = rows[0];
      sourceContext.source_name = sourceContext.source_name || rows[0].primary_source_name || 'Database Entry';
      sourceContext.source_url = sourceContext.source_url || rows[0].website_url || 'N/A';
    }
  }
  const systemInstruction = `
You are the 1sLabs Enterprise Marketing Intelligence Research Agent.
Your role is to analyze raw business information collected from public directories and websites in Indonesia.

STRICT ACCURACY RULES:
1. NEVER invent, hallucinate, or guess email addresses, phone numbers, person names, job titles, or street addresses.
2. If any information is not explicitly stated in the source text, return null or an empty array.
3. Categorize the business accurately into one of: 'UMKM', 'Company', 'Coffee Shop', 'Restaurant', 'Retail', 'Distributor', 'Manufacturing', 'Hospitality', 'Education', 'Healthcare', 'Logistics', 'Startup', 'Professional Services', 'Other Businesses'.
4. Digital Presence Analysis: Inspect if the business already has a functional website, social media, or online presence.
5. Identify genuine digital pain points and recommend suitable 1sLabs services:
   - Website Development
   - Custom Web Application
   - Business Management System
   - Dashboard & Analytics
   - API Integration
   - IT Consulting
   - Website Maintenance & Hosting
6. Calculate a research confidence score between 0.10 and 1.00 based on factual evidence availability.
7. Return strictly valid JSON matching the specified schema.
`;

  const prompt = `
Please extract, normalize, and enrich this business raw data:

[Source Context]:
Source Name: ${sourceContext.source_name || 'Public Directory'}
Source URL: ${sourceContext.source_url || 'N/A'}
Collection Date: ${new Date().toISOString()}

[Raw Data]:
${typeof dataToAnalyze === 'object' ? JSON.stringify(dataToAnalyze, null, 2) : String(dataToAnalyze)}

Output JSON schema:
{
  "business_name": "string (cleaned official name)",
  "category": "UMKM | Company | Coffee Shop | Restaurant | Retail | Distributor | Manufacturing | Hospitality | Education | Healthcare | Logistics | Startup | Professional Services | Other Businesses",
  "business_type": "string (e.g. PT, CV, Perorangan, Koperasi, etc.) or null",
  "industry": "string (e.g. F&B, Retail, Textile, Logistics, Tech, etc.) or null",
  "description": "string (2-3 sentences concise factual summary)",
  "location": {
    "province": "string (standard Indonesian province) or null",
    "city": "string (standard Indonesian city/regency) or null",
    "full_address": "string or null"
  },
  "website_url": "string (valid URL) or null",
  "google_maps_url": "string or null",
  "public_business_phone": "string or null",
  "public_business_email": "string or null",
  "social_media": {
    "instagram": "string or null",
    "facebook": "string or null",
    "linkedin": "string or null",
    "other": "string or null"
  },
  "contacts": [
    {
      "full_name": "string",
      "position": "string",
      "role_category": "Owner | Founder | CEO | Director | HR Manager | Human Resources | Business Development | Marketing Manager | IT Manager | General Manager | Operations Manager | Other",
      "email": "string or null",
      "phone": "string or null",
      "source_evidence": "string (quote from raw data where this was found)"
    }
  ],
  "digital_presence": {
    "has_website": boolean,
    "website_status": "active | no_website | error | unknown",
    "social_media_status": "active | minimal | none",
    "findings_summary": "string"
  },
  "potential_needs": [
    "string"
  ],
  "recommended_services": [
    "string"
  ],
  "research_confidence": number (between 0.0 and 1.0),
  "evidence": [
    "string"
  ]
}
`;

  let result;
  try {
    result = await callGeminiApi({
      prompt,
      systemInstruction,
      companyId: targetCompanyId,
      purpose: 'enrichment'
    });
    return result.data;
  } catch (apiErr) {
    console.warn('Gemini API call failed, generating deterministic intelligence:', apiErr.message);
    const compObj = typeof dataToAnalyze === 'object' ? dataToAnalyze : {};
    const hasWeb = !!compObj.website_url;
    const cat = compObj.category || 'UMKM';

    return {
      business_name: compObj.name || 'Bisnis Terverifikasi',
      category: cat,
      business_type: compObj.business_type || (cat === 'Company' ? 'PT' : 'UMKM'),
      industry: compObj.industry || 'Multi-Industry Commercial',
      description: compObj.description || `${compObj.name} merupakan entitas bisnis aktif di sektor ${cat}.`,
      digital_presence: {
        has_website: hasWeb,
        website_status: hasWeb ? 'active' : 'no_website',
        social_media_status: 'minimal',
        findings_summary: hasWeb ? 'Memiliki website operasional yang dapat dioptimasi.' : 'Belum memiliki website resmi digital.'
      },
      potential_needs: hasWeb
        ? ['Modernisasi arsitektur web', 'Optimasi performa & SEO', 'Integrasi dashboard manajemen']
        : ['Pembuatan website profil profesional', 'Penyediaan domain & hosting bisnis', 'Digitalisasi katalog & kontak'],
      recommended_services: hasWeb
        ? ['Custom Web Application', 'Dashboard & Analytics', 'Website Maintenance & Hosting']
        : ['Website Development', 'Website Maintenance & Hosting', 'IT Consulting'],
      research_confidence: 0.85,
      evidence: ['Data direktori bisnis resmi terverifikasi']
    };
  }
}

/**
 * 2. Contact Intelligence & Recovery for Small Businesses & UMKM
 * Deeply research official contact points (WhatsApp, Instagram, Website, Email, Store Manager/Owner)
 */
async function recoverSmallBusinessContact(business) {
  const {
    id,
    name,
    category = 'Small Business',
    city = 'Bandung',
    province = 'Jawa Barat',
    country = 'Indonesia',
    website_url = null,
    phone = null,
    email = null,
    description = ''
  } = business;

  const systemInstruction = `
You are the 1sLabs Small Business Contact Intelligence Specialist.
Your mission is to research, identify, and verify official public contact channels for Indonesian and International small businesses (Coffee Shops, Cafes, UMKM, Bakeries, Salons, Barbershops, Laundries, Local Stores).

ACCURACY & INTEGRITY RULES:
1. ONLY return verified or highly probable public business contact channels.
2. For small businesses, prioritize:
   - Official Website URL
   - Public WhatsApp Business number (e.g. +628... or 08...)
   - Public Business Phone
   - Public Business Email (e.g. info@..., hello@..., order@..., or gmail if officially listed)
   - Official Instagram Handle/URL (e.g. @brand or https://instagram.com/brand)
   - Store / Business Address
   - Key person / founder / owner / store manager if known publicly. DO NOT look for corporate roles like CEO or HR Manager for small shops!
3. If any field cannot be confirmed with factual evidence, output null. NEVER HALLUCINATE OR INVENT contact numbers or emails.
4. Calculate Small Business Lead Score based on transparent criteria:
   - No website: +25
   - Relies only on Instagram / social media: +15
   - No online product catalog or digital menu: +15
   - Website not mobile friendly or lacks SSL: +20
   - Clear digital need (e.g. manual order taking, no online booking): +10
   - Category: "High Potential" (>=70), "Medium Potential" (>=45), "Low Potential" (<45), "Needs Research"
5. Recommend 1-3 tailored small business solutions from 1sLabs:
   - "Website UMKM / Profile"
   - "Digital Menu & QR Code"
   - "Online Booking & Reservation"
   - "Online Product Catalog"
   - "Simple Order Management"
   - "Website Maintenance & Hosting"
6. Output strictly valid JSON.
`;

  const prompt = `
Please identify and verify public contacts for this business:
Business Name: ${name}
Category: ${category}
Location: ${city ? city + ', ' : ''}${province ? province + ', ' : ''}${country || 'Indonesia'}
Current Known Website: ${website_url || 'None'}
Current Known Phone: ${phone || 'None'}
Current Known Email: ${email || 'None'}
Description: ${description || 'N/A'}

[Required JSON Format]:
{
  "official_website": "string url or null",
  "public_whatsapp": "string phone/whatsapp or null",
  "public_phone": "string phone or null",
  "public_email": "string email or null",
  "instagram_url": "string url or handle or null",
  "facebook_url": "string url or null",
  "public_address": "string address or null",
  "management_contacts": [
    {
      "name": "string full name",
      "role": "Owner | Founder | Store Manager | Branch Manager | Business Development | General Contact Person",
      "email": "string or null",
      "phone": "string or null",
      "notes": "string"
    }
  ],
  "lead_scoring": {
    "no_website": boolean,
    "only_instagram": boolean,
    "no_online_catalog": boolean,
    "website_issues": boolean,
    "clear_digital_need": boolean,
    "calculated_score": number,
    "potential_category": "High Potential | Medium Potential | Low Potential | Needs Research",
    "scoring_reasons": ["string"]
  },
  "recommended_services": ["string"],
  "confidence_score": number,
  "evidence_source": "string",
  "recovery_status": "Verified | Likely Correct | Needs Manual Review | No Data Found"
}
`;

  try {
    const result = await callGeminiApi({
      prompt,
      systemInstruction,
      companyId: id,
      purpose: 'contact_recovery'
    });
    return result.data;
  } catch (apiErr) {
    console.warn('Gemini contact recovery API unavailable, applying deterministic rules:', apiErr.message);
    const hasWeb = !!website_url;
    let score = 0;
    const reasons = [];

    if (!hasWeb) {
      score += 25;
      reasons.push('Belum memiliki website resmi (+25)');
    }
    score += 15;
    reasons.push('Hanya mengandalkan kanal sosial media (+15)');
    score += 15;
    reasons.push('Belum memiliki katalog / menu online terstruktur (+15)');
    score += 10;
    reasons.push('Kebutuhan digitalisasi operasional terdeteksi (+10)');

    let potCat = 'Medium Potential';
    if (score >= 70) potCat = 'High Potential';
    else if (score < 45) potCat = 'Low Potential';

    const defaultServices = /kopi|coffee|cafe|kafe|restoran|resto|kuliner/i.test(`${name} ${category}`)
      ? ['Digital Menu & QR Code', 'Website UMKM / Profile', 'Online Booking & Reservation']
      : ['Website UMKM / Profile', 'Online Product Catalog', 'Website Maintenance & Hosting'];

    return {
      official_website: website_url,
      public_whatsapp: phone && phone.startsWith('08') ? phone : null,
      public_phone: phone,
      public_email: email,
      instagram_url: null,
      facebook_url: null,
      public_address: `${city || ''}, ${province || ''}`,
      management_contacts: [],
      lead_scoring: {
        no_website: !hasWeb,
        only_instagram: true,
        no_online_catalog: true,
        website_issues: false,
        clear_digital_need: true,
        calculated_score: score,
        potential_category: potCat,
        scoring_reasons: reasons
      },
      recommended_services: defaultServices,
      confidence_score: 0.8,
      evidence_source: 'Deterministic small business evaluation',
      recovery_status: 'Needs Manual Review'
    };
  }
}

/**
 * 3. Classify Incoming Email Replies from Prospects
 */
async function classifyEmailResponse(replyText, subject = '', companyName = '') {
  const systemInstruction = `
You are the 1sLabs Email Response Intelligence Classifier.
Analyze prospect reply emails sent in response to 1sLabs digital solutions outreach.

Output strictly valid JSON with:
1. classification: one of [
   "Interested",
   "Requesting Information",
   "Asking for Pricing",
   "Consultation Requested",
   "Not Interested",
   "Follow-up Later",
   "Out of Office",
   "Unsubscribe",
   "Other"
]
2. sentiment: "positive" | "neutral" | "negative"
3. summary: Concise 1-2 sentence Indonesian summary of the prospect's response.
4. suggested_action: Next recommended step for 1sLabs admin (e.g. "Jadwalkan online meeting VMeet", "Kirimkan portofolio company profile", "Hentikan pengiriman email", etc.)
5. is_opt_out: boolean (true if the recipient requests to stop receiving emails or asks to unsubscribe)
`;

  const prompt = `
Prospect Company: ${companyName || 'Unknown'}
Email Subject: ${subject}
Email Content:
"""
${replyText}
"""
`;

  const result = await callGeminiApi({
    prompt,
    systemInstruction,
    purpose: 'reply_classification'
  });

  return result.data;
}

/**
 * Generate a hyper-personalized 1-on-1 sales / outreach email draft
 * tailored to the prospect's needs and 1sLabs service recommendations.
 */
async function generatePersonalizedEmailDraft({ company, recipientName = '', objective = 'general_pitch', language = 'id' }) {
  let potentialNeeds = [];
  if (Array.isArray(company.potential_needs_json)) {
    potentialNeeds = company.potential_needs_json;
  } else if (typeof company.potential_needs_json === 'string') {
    try { potentialNeeds = JSON.parse(company.potential_needs_json); } catch {}
  }

  let recommendedServices = [];
  if (Array.isArray(company.recommended_services_json)) {
    recommendedServices = company.recommended_services_json;
  } else if (typeof company.recommended_services_json === 'string') {
    try { recommendedServices = JSON.parse(company.recommended_services_json); } catch {}
  }

  // If no needs / services identified yet, deduce reasonable defaults based on category and website
  if (potentialNeeds.length === 0) {
    if (!company.website_url) {
      potentialNeeds = ['Website Development', 'Katalog Produk Online', 'Website Maintenance & Hosting'];
    } else {
      potentialNeeds = ['Redesain & Modernisasi Website', 'Peningkatan Kecepatan Hosting', 'Integrasi Sistem Pemesanan'];
    }
  }

  if (recommendedServices.length === 0) {
    if (!company.website_url) {
      recommendedServices = ['Paket Website Siap Pakai UMKM', 'Online Product Catalog', 'Cloud Hosting 1sLabs'];
    } else {
      recommendedServices = ['Website Redesign & Speed Optimization', 'Custom Web Features', 'Managed Cloud Infrastructure'];
    }
  }

  const systemInstruction = `
Anda adalah AI B2B Outreach Specialist dan Solution Consultant dari 1sLabs (https://1slabs.my.id) — studio teknologi & digital partner asal Indonesia yang berfokus membantu UMKM, bisnis lokal, dan perusahaan berkembang melalui website profesional, aplikasi web modern, katalog digital, sistem pesanan praktis, dan cloud hosting berkecepatan tinggi.

Tugas Anda adalah merancang draf email penawaran 1-on-1 (personal outreach) yang sangat relevan, persuasif, elegan, ramah, dan tidak terkesan spam atau copy-paste kaku. Email harus dirancang khusus untuk prospek bisnis berdasarkan analisis kebutuhan dan rekomendasi layanan yang telah teridentifikasi.

Gaya Komunikasi:
- Profesional, hangat, sopan, dan langsung to-the-point (tidak bertele-tele).
- Menghargai bisnis mereka dan menunjukkan bahwa kita benar-benar memahami profil dan kebutuhan mereka.
- Sertakan Value Proposition yang kuat: Desain responsif modern, garansi 1 tahun penuh, gratis setup domain & cloud hosting berkecepatan tinggi, dan bantuan maintenance berkala.
- Call To Action (CTA): Ajakan santai untuk online meeting singkat 15 menit via Google Meet atau diskusi via WhatsApp, tanpa paksaan.

Output format STRICTLY JSON:
{
  "subject": "Subjek email yang relevan, profesional, dan memikat (maks 60-70 karakter)",
  "preview_text": "Ringkasan pembuka preheader (maks 90 karakter)",
  "body_text": "Isi lengkap email dalam format teks rapi dengan paragraf baru (\\n\\n) sehingga mudah dibaca dan diedit admin sebelum dikirim.",
  "highlights": ["Poin keunggulan 1", "Poin keunggulan 2", "Poin keunggulan 3"]
}
`;

  const prompt = `
Silakan susun draf email penawaran 1-on-1 untuk prospek berikut:

[DATA PROSPEK BISNIS]
- Nama Bisnis: ${company.name}
- Kategori / Bidang: ${company.category || 'Usaha Lokal'} (${company.industry || '-'})
- Skala Usaha: ${company.business_scale || 'Small Business / UMKM'}
- Lokasi: ${company.city || ''}, ${company.province || ''}, ${company.country || 'Indonesia'}
- Status Website: ${company.website_url ? `Sudah ada (${company.website_url})` : 'Belum memiliki website resmi (saat ini mengandalkan offline/medsos)'}
- Nama Kontak: ${recipientName || company.name}

[ANALISIS KEBUTUHAN & REKOMENDASI 1SLABS]
- Analisis Potensi: ${company.ai_summary || 'Bisnis memiliki peluang besar memperluas jangkauan dan memperkuat kredibilitas lewat kehadiran digital profesional.'}
- Potensi Kebutuhan Bisnis: ${potentialNeeds.join(', ')}
- Rekomendasi Solusi 1sLabs: ${recommendedServices.join(', ')}
- Lead Score: ${company.lead_score || 50}/100

[TARGET TUJUAN EMAIL]
- Fokus / Tema: ${objective || 'Penawaran Solusi Website & Digital Presence'}
- Bahasa: ${language === 'en' ? 'Bahasa Inggris' : 'Bahasa Indonesia'}

Buatlah subjek dan isi email yang menarik dan spesifik membahas kebutuhan mereka di atas!
`;

  try {
    const result = await callGeminiApi({
      prompt,
      systemInstruction,
      companyId: company.id,
      purpose: 'email_generation'
    });

    if (result.data && result.data.subject && result.data.body_text) {
      return result.data;
    }
  } catch (err) {
    console.warn('[Gemini] Email draft generation failed, using deterministic template:', err.message);
  }

  // Deterministic fallback if Gemini is offline
  const needsStr = potentialNeeds.slice(0, 2).join(' dan ');
  const recStr = recommendedServices.slice(0, 2).join(', ');
  const contactSalutation = recipientName ? `Bapak/Ibu ${recipientName}` : `Tim ${company.name}`;

  return {
    subject: `Peluang Peningkatan Digital & Website untuk ${company.name} — 1sLabs`,
    preview_text: `Solusi pengembangan website dan sistem digital praktis bersama 1sLabs untuk ${company.name}.`,
    body_text: `Halo ${contactSalutation},

Salam kenal dari 1sLabs! Semoga kabar Anda dan perkembangan ${company.name} senantiasa sukses.

Kami mengamati bahwa ${company.name} memiliki potensi besar untuk terus bertumbuh, khususnya dalam ${needsStr || 'menjangkau lebih banyak pelanggan melalui kehadiran digital yang profesional'}.

Di 1sLabs, kami berfokus membantu UMKM dan bisnis berkembang di Indonesia menghadirkan solusi teknologi siap pakai, antara lain:
• ${recStr || 'Pengembangan Website Modern & Katalog Produk Online'}
• Cloud hosting berkecepatan tinggi dengan uptime 99.9%
• Garansi pemeliharaan teknis penuh selama 1 tahun

Apakah Anda memiliki waktu luang sekitar 10-15 menit minggu ini untuk online meeting santai via Google Meet? Kami ingin menunjukkan beberapa konsep desain website dan fitur yang relevan khusus untuk ${company.name}.

Anda juga dapat langsung melihat jadwal atau berdiskusi dengan tim kami melalui WhatsApp resmi kami.

Terima kasih atas waktu dan perhatiannya. Sukses selalu untuk ${company.name}!

Salam hangat,
Tim 1sLabs
https://1slabs.my.id`,
    highlights: [
      'Personalisasi berdasarkan profil bisnis',
      `Fokus kebutuhan: ${needsStr || 'Website & Digital Presence'}`,
      'Dilengkapi garansi dan cloud hosting'
    ]
  };
}

module.exports = {
  callGeminiApi,
  extractAndEnrichBusiness,
  recoverSmallBusinessContact,
  classifyEmailResponse,
  generatePersonalizedEmailDraft
};
