const BaseAdapter = require('./BaseAdapter');

// Approximate bounding boxes for major Indonesian provinces/islands
const INDONESIA_BOUNDS = {
  'DKI Jakarta': { minLat: -6.37, maxLat: -6.08, minLon: 106.68, maxLon: 106.97 },
  'Jawa Barat': { minLat: -7.82, maxLat: -5.91, minLon: 106.37, maxLon: 108.84 },
  'Jawa Tengah': { minLat: -8.21, maxLat: -6.40, minLon: 108.55, maxLon: 111.69 },
  'Jawa Timur': { minLat: -8.78, maxLat: -6.75, minLon: 110.89, maxLon: 114.61 },
  'Banten': { minLat: -7.02, maxLat: -5.85, minLon: 105.10, maxLon: 106.77 },
  'D.I. Yogyakarta': { minLat: -8.20, maxLat: -7.54, minLon: 110.01, maxLon: 110.84 },
  'Bali': { minLat: -8.85, maxLat: -8.06, minLon: 114.43, maxLon: 115.71 },
  'Sumatera Utara': { minLat: 0.61, maxLat: 4.30, minLon: 97.05, maxLon: 100.10 },
  'Sumatera Barat': { minLat: -3.40, maxLat: 0.90, minLon: 98.60, maxLon: 101.90 },
  'Riau': { minLat: -1.15, maxLat: 2.50, minLon: 100.00, maxLon: 103.80 },
  'Sulawesi Selatan': { minLat: -5.75, maxLat: -1.90, minLon: 119.00, maxLon: 121.80 }
};

// Category mapping from OSM tags to 1sLabs business categories
function mapOsmCategory(tags) {
  if (tags.office) {
    if (tags.office === 'it' || tags.office === 'telecommunication' || tags.office === 'software') return { category: 'Company', industry: 'Teknologi dan IT' };
    if (tags.office === 'logistics') return { category: 'Company', industry: 'Logistik dan Ekspedisi' };
    if (tags.office === 'educational_institution') return { category: 'Company', industry: 'Pendidikan' };
    if (tags.office === 'lawyer' || tags.office === 'accountant' || tags.office === 'consulting') return { category: 'Company', industry: 'Jasa Profesional' };
    return { category: 'Company', industry: 'Perusahaan dan Korporasi' };
  }
  if (tags.shop) {
    if (tags.shop === 'coffee' || tags.amenity === 'cafe') return { category: 'UMKM', industry: 'Hospitality & F&B' };
    if (tags.shop === 'supermarket' || tags.shop === 'convenience' || tags.shop === 'general') return { category: 'Retail', industry: 'Retail & Perdagangan' };
    if (tags.shop === 'computer' || tags.shop === 'electronics') return { category: 'Retail', industry: 'Teknologi dan IT' };
    return { category: 'UMKM', industry: 'Perdagangan & Retail' };
  }
  if (tags.industrial || tags.craft) {
    return { category: 'Company', industry: 'Manufaktur & Industri' };
  }
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') {
    return { category: 'UMKM', industry: 'Hospitality & F&B' };
  }
  return { category: 'UMKM', industry: 'Bisnis Lokal' };
}

/**
 * OpenStreetMap Business Adapter
 * Supports Nominatim query with structured metadata parsing
 */
class OpenStreetMapAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
    this.name = 'OpenStreetMap Indonesia';
  }

  async fetchRecords({ sector = null, province = null, city = null, limit = 30 }) {
    const records = [];
    const targetLimit = Math.min(50, limit || this.maxRecords || 30);

    // Build targeted search terms
    const queryParts = [];
    if (sector && !sector.toLowerCase().includes('semua')) {
      queryParts.push(sector);
    } else {
      queryParts.push('perusahaan OR kantor OR usaha');
    }

    if (city && !city.toLowerCase().includes('semua')) {
      queryParts.push(city);
    }
    if (province && !province.toLowerCase().includes('semua')) {
      queryParts.push(province);
    }
    queryParts.push('Indonesia');

    const searchQuery = queryParts.join(' ');

    try {
      // 1. Query Nominatim OpenStreetMap API
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&extratags=1&limit=${targetLimit}`;
      
      const items = await this.fetchJson(nominatimUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; 1sLabsLeadDiscovery/1.0; +https://1slabs.my.id)'
        },
        timeout: 15000
      });

      if (!Array.isArray(items)) return [];

      for (const item of items) {
        const tags = item.extratags || {};
        const address = item.address || {};

        // Name
        const rawName = tags.name || tags['name:id'] || tags['name:en'] || item.name || (item.display_name ? item.display_name.split(',')[0].trim() : null);
        if (!rawName || rawName.length < 2) continue;

        // Skip purely geographical administrative features (e.g. "Jawa Barat", "Kecamatan Bandung")
        if (item.type === 'administrative' || item.class === 'boundary' || item.type === 'state' || item.type === 'city') {
          continue;
        }

        // Location
        const resolvedProvince = address.state || address.province || province || 'Indonesia';
        const resolvedCity = address.city || address.county || address.town || address.municipality || city || null;
        const fullAddr = item.display_name || null;

        // Website & Contact details
        const website = tags.website || tags['contact:website'] || tags.url || null;
        const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null;
        const email = tags.email || tags['contact:email'] || null;

        // Categorize
        const { category, industry } = mapOsmCategory({
          office: tags.office,
          shop: tags.shop || item.type,
          industrial: tags.industrial,
          craft: tags.craft,
          amenity: tags.amenity
        });

        const contacts = [];
        if (email) {
          contacts.push({
            full_name: 'Official Contact (OSM)',
            position: 'Public Representative',
            role_category: 'Business Development',
            email: email.trim().toLowerCase(),
            phone: phone || null,
            channel: 'Email'
          });
        }

        records.push({
          source_record_id: `osm-${item.osm_type || 'node'}-${item.osm_id || item.place_id}`,
          name: rawName,
          category,
          business_type: tags.office ? 'Perusahaan' : 'UMKM',
          industry,
          description: `Data bisnis dari OpenStreetMap (OSM ${item.osm_type} #${item.osm_id}). Tipe: ${item.type || tags.shop || tags.office || 'business'}.`,
          province: resolvedProvince,
          city: resolvedCity,
          address: fullAddr,
          website_url: website,
          phone: phone,
          email: email,
          social_media: {},
          contacts,
          raw_payload: {
            osm_id: item.osm_id,
            osm_type: item.osm_type,
            place_id: item.place_id,
            class: item.class,
            type: item.type,
            lat: item.lat,
            lon: item.lon,
            tags
          }
        });
      }
    } catch (err) {
      console.warn(`[OpenStreetMapAdapter Error]: ${err.message}`);
    }

    return records;
  }
}

module.exports = OpenStreetMapAdapter;

