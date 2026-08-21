import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/authenticate.js';
import { fetchFromSource, syncStatus } from '../market/ingest.js';

const router = Router();

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'spices', 'dairy'];

function toRecord(row) {
  return {
    id: row.id,
    cityRegion: row.city_region,
    state: row.state,
    market: row.market_name,
    category: row.category,
    commodity: row.commodity,
    variety: row.variety,
    grade: row.grade,
    minPriceKg: row.min_price_kg,
    modalPriceKg: row.modal_price_kg,
    maxPriceKg: row.max_price_kg,
    arrivalQuantity: row.arrival_quantity,
    arrivalUnit: row.arrival_unit,
    imageUrl: row.image_url || null,
    sourceName: row.source_name,
    sourceDate: row.source_date,
    sourceUpdatedAt: row.source_updated_at,
  };
}

// GET /api/market-prices?city_region=&category=&commodity=&market=&variety=
// Only ever returns published rows — quarantined records are never served
// as if they were valid (spec: never show a failed-validation record).
router.get('/', (req, res) => {
  const { city_region, category, commodity, market, variety } = req.query;
  let sql = "SELECT * FROM market_prices WHERE status = 'published'";
  const params = [];
  if (city_region) { sql += ' AND city_region = ?'; params.push(city_region); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (commodity) { sql += ' AND commodity = ?'; params.push(commodity); }
  if (market) { sql += ' AND market_name = ?'; params.push(market); }
  if (variety) { sql += ' AND variety = ?'; params.push(variety); }
  sql += ' ORDER BY city_region, market_name, commodity';

  const rows = db.prepare(sql).all(...params);
  const lastUpdatedRow = db.prepare("SELECT MAX(fetched_at) AS t FROM market_prices WHERE status = 'published'").get();

  res.json({
    source: rows[0]?.source_name || 'FarmTrust Sample Data',
    lastUpdated: lastUpdatedRow?.t || null,
    currency: 'INR',
    unit: 'kg',
    records: rows.map(toRecord),
  });
});

// GET /api/market-prices/meta — data-driven filter options, no hardcoded
// frontend commodity list.
router.get('/meta', (_req, res) => {
  const cityRegions = db.prepare("SELECT DISTINCT city_region FROM market_prices WHERE status = 'published' ORDER BY city_region").all().map(r => r.city_region);
  const commoditiesByCategory = {};
  for (const cat of CATEGORIES) {
    commoditiesByCategory[cat] = db
      .prepare("SELECT DISTINCT commodity FROM market_prices WHERE status = 'published' AND category = ? ORDER BY commodity")
      .all(cat)
      .map(r => r.commodity);
  }
  const marketsByCity = {};
  for (const city of cityRegions) {
    marketsByCity[city] = db
      .prepare("SELECT DISTINCT market_name FROM market_prices WHERE status = 'published' AND city_region = ? ORDER BY market_name")
      .all(city)
      .map(r => r.market_name);
  }
  res.json({ cityRegions, categories: CATEGORIES, commoditiesByCategory, marketsByCity });
});

// GET /api/market-prices/history?commodity=&city_region=&market=&days=7|30|90
// There is no real historical feed behind local seed data — this generates a
// deterministic synthetic series from today's published record so the UI can
// demonstrate the history view. Callers/UI must label this as sample data,
// never as real historical AGMARKNET prices.
function seededVariation(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
  return (((h >>> 0) % 2000) / 1000) - 1; // -1..1
}

router.get('/history', (req, res) => {
  const { commodity, city_region, market, days } = req.query;
  const period = [7, 30, 90].includes(Number(days)) ? Number(days) : 7;

  if (!commodity || !city_region) {
    return res.status(400).json({ error: 'commodity and city_region are required' });
  }

  let sql = "SELECT * FROM market_prices WHERE status = 'published' AND commodity = ? AND city_region = ?";
  const params = [commodity, city_region];
  if (market) { sql += ' AND market_name = ?'; params.push(market); }
  const base = db.prepare(sql).get(...params);

  if (!base) {
    return res.json({ commodity, cityRegion: city_region, market: market || null, series: [] });
  }

  const series = [];
  const today = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const v = seededVariation(`${commodity}-${city_region}-${market || ''}-${dateStr}`) * 0.05; // ±5%/day
    series.push({
      date: dateStr,
      minPriceKg: Math.round(base.min_price_kg * (1 + v) * 100) / 100,
      modalPriceKg: Math.round(base.modal_price_kg * (1 + v) * 100) / 100,
      maxPriceKg: Math.round(base.max_price_kg * (1 + v) * 100) / 100,
    });
  }

  res.json({ commodity, cityRegion: city_region, market: base.market_name, series });
});

// GET /api/market-prices/admin/status — admin console panel data.
router.get('/admin/status', requireAdmin, (_req, res) => {
  res.json(syncStatus());
});

// POST /api/market-prices/admin/sync — honest response about what actually
// happened, never a fabricated "synced N records" when nothing was fetched.
router.post('/admin/sync', requireAdmin, async (_req, res) => {
  try {
    const result = await fetchFromSource();
    if (result === null) {
      return res.json({
        ok: true,
        mode: 'local-seed',
        message: 'No external source configured — serving local sample data. Set AGMARKNET_API_KEY to enable live sync.',
      });
    }
    // Unreachable until a real fetchFromSource() implementation lands.
    res.json({ ok: true, mode: 'live', message: 'Sync complete.' });
  } catch (err) {
    res.status(501).json({ ok: false, mode: 'not-implemented', error: err.message });
  }
});

export default router;
