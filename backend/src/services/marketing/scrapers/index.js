const ISEFAdapter = require('./ISEFAdapter');
const KadinAdapter = require('./KadinAdapter');
const OpenDataJabarAdapter = require('./OpenDataJabarAdapter');
const OfficialWebsiteAdapter = require('./OfficialWebsiteAdapter');
const GoogleBusinessAdapter = require('./GoogleBusinessAdapter');
const InternationalBusinessAdapter = require('./InternationalBusinessAdapter');
const OpenStreetMapAdapter = require('./OpenStreetMapAdapter');
const SatuDataIndonesiaAdapter = require('./SatuDataIndonesiaAdapter');
const PadiUmkmAdapter = require('./PadiUmkmAdapter');

const ADAPTERS = {
  isef: ISEFAdapter,
  kadin: KadinAdapter,
  gov_open_data: OpenDataJabarAdapter,
  satu_data_umkm: SatuDataIndonesiaAdapter,
  satu_data_indonesia: SatuDataIndonesiaAdapter,
  osm_indonesia: OpenStreetMapAdapter,
  osm_overpass: OpenStreetMapAdapter,
  padi_umkm: PadiUmkmAdapter,
  official_website: OfficialWebsiteAdapter,
  google_business: GoogleBusinessAdapter,
  international_business: InternationalBusinessAdapter,
  custom_directory: ISEFAdapter,
  csv_import: ISEFAdapter
};

function getScraperAdapter(source) {
  const AdapterClass = ADAPTERS[source.source_type] || OpenStreetMapAdapter;
  return new AdapterClass(source);
}

module.exports = {
  getScraperAdapter,
  ADAPTERS
};
