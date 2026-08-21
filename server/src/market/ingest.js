import { db } from '../db.js';

// Pluggable seam for a real government market-data source (AGMARKNET, via
// data.gov.in's open API). Not implemented here — see fetchFromSource below
// for exactly what a real implementation would need. Until AGMARKNET_API_KEY
// is set, the app serves the local seed data from server/src/db.js as-is;
// there is nothing to "sync" against in that mode.

// fetchFromSource(): returns raw source records in a shape normalize.js's
// convertToKg/validateRecord can consume, or null if there's no source
// configured. Real implementation would need:
//   - a data.gov.in resource ID for the AGMARKNET Daily Price and Arrival
//     Report (register at https://data.gov.in and request/verify the
//     resource ID — this changes over time and must not be guessed),
//   - the request shape for that resource (typically a REST GET with an
//     api-key query param and format=json, paginated via limit/offset),
//   - mapping the response's state/district/market/commodity/variety/grade/
//     min_price/max_price/modal_price/arrival fields onto the raw-record
//     shape normalize.js expects (price values are per-quintal from
//     AGMARKNET, matching the source_unit='quintal' convention already used
//     by the seed data in db.js).
export async function fetchFromSource() {
  const apiKey = process.env.AGMARKNET_API_KEY;
  if (!apiKey) {
    return null; // not configured — local seed data is the served data
  }
  throw new Error(
    'AGMARKNET_API_KEY is set but live ingestion is not implemented — see comments in server/src/market/ingest.js'
  );
}

// Honest status for the admin console. Never claims a live sync ran when it
// didn't — reports what's actually true about the local market_prices table.
export function syncStatus() {
  const apiKey = process.env.AGMARKNET_API_KEY;
  const total = db.prepare('SELECT COUNT(*) AS n FROM market_prices').get().n;
  const published = db.prepare("SELECT COUNT(*) AS n FROM market_prices WHERE status = 'published'").get().n;
  const quarantined = db.prepare("SELECT COUNT(*) AS n FROM market_prices WHERE status = 'quarantined'").get().n;
  const latest = db.prepare('SELECT MAX(fetched_at) AS t FROM market_prices').get().t;

  // "Stale" here means older than 7 days relative to now — since seed data is
  // stamped at boot time it will read as fresh immediately after a fresh DB,
  // which is correct: it genuinely was just fetched (seeded).
  const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stale = db
    .prepare("SELECT COUNT(*) AS n FROM market_prices WHERE status = 'published' AND fetched_at < ?")
    .get(new Date(staleCutoff).toISOString()).n;

  return {
    sourceStatus: apiKey ? 'not-implemented' : 'local-seed',
    sourceConfigured: !!apiKey,
    lastSync: latest,
    recordCount: total,
    publishedCount: published,
    quarantinedCount: quarantined,
    staleCount: stale,
  };
}
