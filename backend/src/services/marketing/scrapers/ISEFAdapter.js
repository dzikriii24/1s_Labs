const BaseAdapter = require('./BaseAdapter');

/**
 * ISEF (Indonesia Sharia Economic Festival) Business Matching UMKM Adapter
 * Source: https://bm.isef.co.id/umkm
 * Features: 284+ verified real Indonesian UMKM & businesses across various sectors.
 */
class ISEFAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
    this.baseUrl = 'https://bm.isef.co.id';
  }

  async fetchRecords({ sector = null, province = null, city = null, limit = 30 }) {
    const records = [];
    const targetLimit = limit || this.maxRecords;

    try {
      const htmlUrl = `${this.baseUrl}/umkm`;
      const html = await this.fetchHtml(htmlUrl, { timeout: 15000 });

      // Match each UMKM anchor card
      const anchorRegex = /<a[^>]*href=["'](\/umkm\/iksp[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = anchorRegex.exec(html)) !== null && records.length < targetLimit) {
        const slug = match[1];
        const cardHtml = match[2];

        // 1. Business Name (inside <h3>)
        const nameMatch = cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
        let name = nameMatch ? nameMatch[1].trim() : null;
        if (!name || name.length < 2) continue;

        // Skip international sample showcase if general Indonesian data is desired
        if (/^\d+\.\s*(India|Malaysia|Turki|Dubai|Uzbekistan|Taiwan|Korea|Philipine)/i.test(name)) {
          continue;
        }

        // 2. Sector / Category
        const sectorMatch = cardHtml.match(/<span[^>]*bg-accent-gold\/10[^>]*>([^<]+)<\/span>/i);
        const sectorFound = sectorMatch ? sectorMatch[1].replace(/&amp;/g, '&').trim() : (sector || 'Consumer Goods & Retail');

        // 3. City and Province (inside truncate badge with map-pin)
        const locMatch = cardHtml.match(/<span[^>]*class="truncate[^"]*"[^>]*>([^<]+)<\/span>/i);
        let locText = locMatch ? locMatch[1].trim() : '';
        let extractedCity = city || null;
        let extractedProvince = province || null;

        if (locText && locText.includes(',')) {
          const parts = locText.split(',');
          extractedCity = parts[0].trim();
          extractedProvince = parts[1].trim();
        } else if (locText) {
          extractedCity = locText;
        }

        // Determine business category
        let category = 'UMKM';
        if (/kopi|coffee|cafe|kafe/i.test(name) || /kopi|coffee/i.test(sectorFound)) {
          category = 'Coffee Shop';
        } else if (/makanan|camilan|resto|kuliner|food|kitchen/i.test(sectorFound) || /resto|catering/i.test(name)) {
          category = 'Restaurant';
        } else if (/pakaian|fashion|batik|busana|tekstil|hijab/i.test(sectorFound)) {
          category = 'Retail';
        } else if (name.startsWith('PT') || name.startsWith('CV')) {
          category = 'Company';
        }

        records.push({
          source_record_id: `isef-${slug.replace('/umkm/', '')}`,
          name,
          category,
          business_type: name.startsWith('PT') ? 'PT' : (name.startsWith('CV') ? 'CV' : 'UMKM'),
          industry: sectorFound,
          description: `Bisnis terverifikasi Bank Indonesia ISEF Business Matching di wilayah ${locText || 'Indonesia'}. Sektor: ${sectorFound}.`,
          province: extractedProvince || 'Jawa Barat',
          city: extractedCity || 'Bandung',
          address: locText ? `Wilayah ${locText}` : null,
          website_url: null,
          google_maps_url: locText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + locText)}` : null,
          phone: null,
          email: null,
          social_media: {},
          contacts: [],
          raw_payload: {
            isef_slug: slug,
            isef_url: `${this.baseUrl}${slug}`,
            sector: sectorFound,
            location: locText
          }
        });
      }
    } catch (err) {
      console.warn(`[ISEFAdapter Error]: ${err.message}`);
    }

    return records;
  }
}

module.exports = ISEFAdapter;
