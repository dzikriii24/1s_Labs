const BaseAdapter = require('./BaseAdapter');

/**
 * Open Data Jawa Barat & Data.go.id Public Dataset Adapter
 * Source: https://opendata.jabarprov.go.id/
 */
class OpenDataJabarAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
    this.apiUrl = 'https://data.jabarprov.go.id/api-backend/bigdata/disperindag/od_15082_daftar_industri_kecil_menengah_ikm_berdasarkan_kabupaten';
  }

  async fetchRecords({ sector = null, province = 'Jawa Barat', city = null, limit = 40 }) {
    const records = [];
    const targetLimit = limit || this.maxRecords;

    try {
      // Jabar Open Data portal public query
      const url = `https://opendata.jabarprov.go.id/api-backend/bigdata/disperindag/od_15082_daftar_industri_kecil_menengah_ikm_berdasarkan_kabupaten?limit=${targetLimit}`;
      const json = await this.fetchJson(url, { timeout: 12000 });

      if (json && json.data && Array.isArray(json.data)) {
        for (const item of json.data) {
          const businessName = item.nama_ikm || item.nama_usaha || item.nama_perusahaan || item.nama;
          if (!businessName) continue;

          records.push({
            source_record_id: `jabar-${item.id || records.length + 1}`,
            name: businessName,
            category: 'UMKM',
            business_type: item.bentuk_usaha || 'IKM',
            industry: item.komoditi || item.jenis_usaha || sector || 'Manufaktur & IKM',
            description: item.produk_utama ? `Produk utama: ${item.produk_utama}` : null,
            province: 'Jawa Barat',
            city: item.nama_kabupaten_kota || city || null,
            address: item.alamat || null,
            website_url: item.website || null,
            phone: item.kontak || item.telepon || null,
            email: item.email || null,
            social_media: {},
            contacts: item.nama_pemilik ? [{
              full_name: item.nama_pemilik,
              position: 'Pemilik (Owner)',
              role_category: 'Owner',
              email: null,
              phone: item.telepon || null
            }] : [],
            raw_payload: item
          });

          if (records.length >= targetLimit) break;
        }
      }
    } catch (err) {
      console.warn(`[OpenDataJabarAdapter Error]: ${err.message}`);
    }

    return records;
  }
}

module.exports = OpenDataJabarAdapter;

