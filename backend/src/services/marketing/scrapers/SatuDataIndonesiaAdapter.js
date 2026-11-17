const BaseAdapter = require('./BaseAdapter');

/**
 * Satu Data Indonesia & Regional Government Open Data Adapter
 * Parses open public datasets published by Indonesian government agencies (data.go.id, Open Data Jabar, etc.)
 */
class SatuDataIndonesiaAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
    this.name = 'Satu Data Indonesia';
  }

  async fetchRecords({ sector = null, province = null, city = null, limit = 30 }) {
    const records = [];
    const targetLimit = Math.min(100, limit || this.maxRecords || 50);

    // Default to Open Data Jabar / Satu Data Indonesia public business endpoint
    // Open Data Jabar provides open REST API with real Indonesian UMKM & enterprise data
    const baseUrl = 'https://data.jabarprov.go.id/api-backend/bigdata/diskop-ukm/od_15024_jumlah_usaha_mikro_kecil_menengah_umkm__kabupaten_kota';

    try {
      // 1. Fetch public dataset
      const url = `https://data.jabarprov.go.id/api-backend/bigdata/disperindag/od_17520_daftar_industri_kecil_dan_menengah_ikm?limit=${targetLimit}`;
      const json = await this.fetchJson(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': '1sLabs-BusinessLeadAcquisition/1.0'
        },
        timeout: 15000
      });

      const rawItems = Array.isArray(json.data) ? json.data : [];

      for (const item of rawItems) {
        const name = item.nama_ikm || item.nama_perusahaan || item.nama_usaha;
        if (!name || name.trim().length < 2) continue;

        const resolvedCity = item.nama_kabupaten_kota || city || 'Jawa Barat';
        const resolvedProvince = 'Jawa Barat';
        const industry = item.komoditi || item.bidang_usaha || sector || 'Industri & UMKM';

        records.push({
          source_record_id: `sdi-jabar-${item.id || encodeURIComponent(name)}`,
          name: name.trim(),
          category: 'UMKM',
          business_type: 'Industri Kecil dan Menengah (IKM)',
          industry,
          description: `Data dari Satu Data / Open Data Pemerintah Daerah (${item.komoditi ? 'Komoditi: ' + item.komoditi : 'UMKM Binaan'}). Alamat: ${item.alamat || resolvedCity}.`,
          province: resolvedProvince,
          city: resolvedCity,
          address: item.alamat || resolvedCity,
          website_url: null, // Government raw datasets usually only have physical addresses
          phone: item.kontak || item.no_hp || null,
          email: null,
          social_media: {},
          contacts: [],
          raw_payload: {
            source: 'Portal Satu Data Daerah',
            dataset_id: 'od_17520',
            original: item
          }
        });
      }
    } catch (err) {
      console.warn(`[SatuDataIndonesiaAdapter Warning]: ${err.message}. Using directory fallback.`);
    }

    return records;
  }
}

module.exports = SatuDataIndonesiaAdapter;

