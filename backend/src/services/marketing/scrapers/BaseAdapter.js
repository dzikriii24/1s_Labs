/**
 * Base Scraper Adapter
 * Every specific source adapter must extend this class and implement `fetchRecords()`
 */
class BaseAdapter {
  constructor(sourceConfig = {}) {
    this.sourceConfig = sourceConfig;
    this.name = sourceConfig.name || 'Generic Adapter';
    this.rateLimitPerMinute = sourceConfig.rate_limit_per_minute || 20;
    this.maxRecords = sourceConfig.max_records_per_run || 50;
  }

  /**
   * Main method to be implemented by child classes
   * Returns array of standardized raw business records:
   * [
   *   {
   *     source_record_id: string,
   *     name: string,
   *     category: string,
   *     industry: string,
   *     description: string,
   *     province: string,
   *     city: string,
   *     address: string,
   *     website_url: string,
   *     phone: string,
   *     email: string,
   *     social_media: object,
   *     contacts: array,
   *     raw_payload: object
   *   }
   * ]
   */
  async fetchRecords({ sector = null, province = null, city = null, limit = null }) {
    throw new Error(`fetchRecords() must be implemented in ${this.constructor.name}`);
  }

  /**
   * Respect source rate limits with jitter
   */
  async delayBetweenRequests(customMs = null) {
    const ms = customMs || Math.round((60000 / this.rateLimitPerMinute) + Math.random() * 200);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safe JSON fetch with User-Agent and timeout
   */
  async fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 1sLabs-Business-Discovery/1.0',
        'Accept': 'application/json, text/plain, */*',
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(options.timeout || 15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return await response.json();
  }

  /**
   * Safe HTML fetch
   */
  async fetchHtml(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 1sLabs-Business-Discovery/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(options.timeout || 15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return await response.text();
  }
}

module.exports = BaseAdapter;

