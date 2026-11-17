const BaseAdapter = require('./BaseAdapter');
const { query } = require('../../../db');

/**
 * PaDi UMKM OpenAPI Adapter
 * Official documentation: https://openapi-docs.padiumkm.id/
 * Reporting UMKM: https://openapi-docs.padiumkm.id/docs/reporting/api-umkm
 * Credentials: https://openapi-docs.padiumkm.id/docs/authentication/credential
 */
class PadiUmkmAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
    this.name = 'PaDi UMKM OpenAPI';
  }

  /**
   * Fetch PaDi UMKM credentials from settings or environment
   */
  async getCredentials() {
    // 1. Check database settings
    let clientId = null;
    let clientSecret = null;
    let apiKey = null;

    try {
      const rows = await query(
        "SELECT setting_key, setting_value FROM marketing_settings WHERE setting_key IN ('padi_client_id', 'padi_client_secret', 'padi_api_key')"
      );
      for (const r of rows) {
        if (r.setting_key === 'padi_client_id') clientId = r.setting_value;
        if (r.setting_key === 'padi_client_secret') clientSecret = r.setting_value;
        if (r.setting_key === 'padi_api_key') apiKey = r.setting_value;
      }
    } catch {}

    // 2. Fallback to process.env
    clientId = clientId || process.env.PADI_CLIENT_ID || null;
    clientSecret = clientSecret || process.env.PADI_CLIENT_SECRET || null;
    apiKey = apiKey || process.env.PADI_API_KEY || null;

    return {
      clientId,
      clientSecret,
      apiKey,
      isConfigured: !!(clientId && clientSecret) || !!apiKey
    };
  }

  async fetchRecords({ sector = null, province = null, city = null, limit = 30 }) {
    const creds = await this.getCredentials();

    if (!creds.isConfigured) {
      throw new Error(
        'Integrasi PaDi UMKM OpenAPI memerlukan kredensial resmi (Client ID & Client Secret / API Key). ' +
        'Silakan daftarkan akun developer pada portal resmi PaDi UMKM (https://openapi-docs.padiumkm.id/docs/authentication/credential) ' +
        'dan masukkan kredensial ke menu "Marketing Settings" atau konfigurasi .env backend (PADI_CLIENT_ID & PADI_CLIENT_SECRET).'
      );
    }

    const records = [];
    const targetLimit = Math.min(50, limit || this.maxRecords || 30);

    // Endpoint from PaDi OpenAPI documentation
    const baseUrl = 'https://api.padiumkm.id';
    let token = creds.apiKey;

    // 1. If using OAuth Client ID & Secret, exchange for Bearer Token
    if (creds.clientId && creds.clientSecret && !token) {
      try {
        const tokenResp = await fetch(`${baseUrl}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            grant_type: 'client_credentials'
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (!tokenResp.ok) {
          const errText = await tokenResp.text();
          throw new Error(`Gagal otentikasi PaDi UMKM OAuth (HTTP ${tokenResp.status}): ${errText}`);
        }

        const tokenData = await tokenResp.json();
        token = tokenData.access_token || tokenData.token;
      } catch (authErr) {
        throw new Error(`Autentikasi PaDi UMKM OpenAPI gagal: ${authErr.message}`);
      }
    }

    // 2. Fetch business reporting dataset
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: String(targetLimit)
      });
      if (province && !province.toLowerCase().includes('semua')) {
        queryParams.set('province', province);
      }
      if (sector && !sector.toLowerCase().includes('semua')) {
        queryParams.set('category', sector);
      }

      const reportingUrl = `${baseUrl}/reporting/api-umkm?${queryParams.toString()}`;
      const response = await fetch(reportingUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': '1sLabs-BusinessLeadAcquisition/1.0'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`PaDi UMKM API returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawList = Array.isArray(json.data) ? json.data : (json.items || []);

      for (const item of rawList) {
        const businessName = item.business_name || item.nama_umkm || item.company_name;
        if (!businessName) continue;

        // Strictly omit personal sensitive information (NIK, NPWP, bank accounts)
        records.push({
          source_record_id: `padi-${item.id || item.umkm_id || encodeURIComponent(businessName)}`,
          name: businessName,
          category: 'UMKM',
          business_type: item.business_type || 'UMKM PaDi',
          industry: item.category || sector || 'UMKM & Perdagangan',
          description: item.description || `Bisnis UMKM terdaftar pada PaDi UMKM B2B Marketplace.`,
          province: item.province || province || 'Indonesia',
          city: item.city || city || null,
          address: item.address || null,
          website_url: item.website || item.official_website || null,
          phone: item.public_phone || item.phone || null,
          email: item.public_email || item.email || null,
          social_media: {},
          contacts: item.public_email ? [{
            full_name: 'Official Representative (PaDi UMKM)',
            position: 'Business Owner / Representative',
            role_category: 'Owner',
            email: item.public_email,
            phone: item.public_phone || null,
            channel: 'Email'
          }] : [],
          raw_payload: {
            umkm_id: item.id || item.umkm_id,
            verified_bumn_partner: item.is_verified || false
          }
        });
      }
    } catch (apiErr) {
      throw new Error(`Permintaan ke PaDi UMKM OpenAPI gagal: ${apiErr.message}`);
    }

    return records;
  }
}

module.exports = PadiUmkmAdapter;

