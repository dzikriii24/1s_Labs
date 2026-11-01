const ISEFAdapter = require('./ISEFAdapter');
const KadinAdapter = require('./KadinAdapter');
const OpenDataJabarAdapter = require('./OpenDataJabarAdapter');
const OfficialWebsiteAdapter = require('./OfficialWebsiteAdapter');
const GoogleBusinessAdapter = require('./GoogleBusinessAdapter');
const InternationalBusinessAdapter = require('./InternationalBusinessAdapter');

const ADAPTERS = {
  isef: ISEFAdapter,
  kadin: KadinAdapter,
  gov_open_data: OpenDataJabarAdapter,
  satu_data_umkm: OpenDataJabarAdapter, // Uses regional open data fallback
  official_website: OfficialWebsiteAdapter,
  google_business: GoogleBusinessAdapter,
  international_business: InternationalBusinessAdapter,
  custom_directory: ISEFAdapter
};

function getScraperAdapter(source) {
  const AdapterClass = ADAPTERS[source.source_type] || ISEFAdapter;
  return new AdapterClass(source);
}

module.exports = {
  getScraperAdapter,
  ADAPTERS
};

