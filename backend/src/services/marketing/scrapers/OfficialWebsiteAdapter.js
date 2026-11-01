const BaseAdapter = require('./BaseAdapter');

/**
 * Official Business Website Deep Research Adapter
 * Inspects homepage, /about, /contact, and /team pages for legitimate public business contacts
 */
class OfficialWebsiteAdapter extends BaseAdapter {
  constructor(sourceConfig = {}) {
    super(sourceConfig);
  }

  async fetchRecords({ targetUrl = null, limit = 5 }) {
    if (!targetUrl) return [];

    let baseUrl = targetUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }

    const records = [];

    try {
      // 1. Fetch homepage
      const homeHtml = await this.fetchHtml(baseUrl, { timeout: 10000 });
      
      // Extract title/business name
      const titleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const businessName = rawTitle.split(/[-–|]/)[0].trim() || 'Official Website';

      // Extract emails
      const emailMatches = homeHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const cleanEmails = [...new Set(emailMatches.filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('example.com') && !e.includes('sentry.io')))];

      // Extract phone
      const phoneMatches = homeHtml.match(/(?:\+62|62|08)[0-9]{8,12}/g) || [];
      const cleanPhones = [...new Set(phoneMatches)];

      // Extract social media links
      const socialMedia = {};
      const igMatch = homeHtml.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (igMatch) socialMedia.instagram = igMatch[0];
      const fbMatch = homeHtml.match(/https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9._]+)/i);
      if (fbMatch) socialMedia.facebook = fbMatch[0];
      const liMatch = homeHtml.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)/i);
      if (liMatch) socialMedia.linkedin = liMatch[0];

      // 2. Discover /contact or /about page
      let contactHtml = '';
      try {
        const contactUrl = new URL('/contact', baseUrl).href;
        contactHtml = await this.fetchHtml(contactUrl, { timeout: 8000 });
        const moreEmails = contactHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        for (const e of moreEmails) {
          if (!cleanEmails.includes(e) && !e.includes('sentry.io')) cleanEmails.push(e);
        }
      } catch {}

      records.push({
        source_record_id: `site-${encodeURIComponent(baseUrl)}`,
        name: businessName,
        category: 'Company',
        business_type: 'Official Website',
        industry: null,
        description: null,
        province: null,
        city: null,
        address: null,
        website_url: baseUrl,
        phone: cleanPhones[0] || null,
        email: cleanEmails[0] || null,
        social_media: socialMedia,
        contacts: cleanEmails.map(email => ({
          full_name: 'Official Representative',
          position: 'Customer / Business Relations',
          role_category: 'Business Development',
          email,
          phone: cleanPhones[0] || null
        })),
        raw_payload: {
          all_emails: cleanEmails,
          all_phones: cleanPhones,
          social_links: socialMedia
        }
      });
    } catch (err) {
      console.warn(`[OfficialWebsiteAdapter Error for ${baseUrl}]: ${err.message}`);
    }

    return records;
  }
}

module.exports = OfficialWebsiteAdapter;

