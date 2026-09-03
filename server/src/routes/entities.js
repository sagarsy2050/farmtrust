import { Router } from 'express';
import { db, uuidv4 } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/authenticate.js';
import { recomputeAndApply } from '../verification/compute.js';
import { recomputeAreaMatch } from '../verification/areaMatch.js';

const router = Router();
const now = () => new Date().toISOString();

// Columns that are stored as JSON text and need parse/stringify at the boundary.
const JSON_COLS = {
  farms: ['boundary', 'crops'],
  products: [],
  orders: ['items'],
  documents: [],
  reviews: [],
  verification_checks: ['flagged_issues'],
};
const BOOL_COLS = {
  farms: [], products: ['pickup_available', 'delivery_available'],
  orders: [], documents: ['confirmation', 'ai_flagged'], reviews: ['would_buy_again'], verification_checks: [],
};

// Permission predicates translated 1:1 from the original entity .jsonc `rls` blocks.
// `own` = created_by_id === user.id. Admin bypasses everything.
const RULES = {
  farms: {
    read: (row, user) => row.verification_status === 'verified' || row.created_by_id === user?.id || user?.role === 'admin',
    create: () => true,
    update: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
  products: {
    read: (row, user) => row.status === 'published' || row.status === 'sold_out' || row.created_by_id === user?.id || user?.role === 'admin',
    create: () => true,
    update: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
  orders: {
    read: (row, user) => row.created_by_id === user?.id || row.farmer_id === user?.id || user?.role === 'admin',
    create: () => true,
    update: (row, user) => row.created_by_id === user?.id || row.farmer_id === user?.id || user?.role === 'admin',
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
  documents: {
    read: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    create: () => true,
    update: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
  reviews: {
    read: () => true, // original rls.read = {} -> public
    create: () => true,
    update: (row, user) => row.created_by_id === user?.id,
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
  verification_checks: {
    read: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    create: (_row, user) => !!user, // created_by_id or admin — any authenticated user owns their own create
    update: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
    delete: (row, user) => row.created_by_id === user?.id || user?.role === 'admin',
  },
};

function deserialize(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const c of JSON_COLS[table] || []) { try { out[c] = JSON.parse(out[c] ?? '[]'); } catch { out[c] = []; } }
  for (const c of BOOL_COLS[table] || []) out[c] = !!out[c];
  return out;
}
function serializeForWrite(table, data) {
  const out = { ...data };
  for (const c of JSON_COLS[table] || []) if (c in out) out[c] = JSON.stringify(out[c] ?? []);
  for (const c of BOOL_COLS[table] || []) if (c in out) out[c] = out[c] ? 1 : 0;
  return out;
}

function columnsOf(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
}

function buildRouterFor(table) {
  const r = Router();
  const cols = columnsOf(table);
  const rules = RULES[table];

  // asServiceRole calls set X-Service-Role: true; only honored for admins (bypasses read filtering, not auth).
  function isServiceRole(req) {
    return req.headers['x-service-role'] === 'true' && req.user?.role === 'admin';
  }

  // GET /:table?sort=-created_date&limit=100&<field>=value...
  r.get('/', optionalAuth, (req, res) => {
    const { sort, limit, ...filters } = req.query;
    let rows = db.prepare(`SELECT * FROM ${table}`).all();
    for (const [k, v] of Object.entries(filters)) {
      if (cols.includes(k)) rows = rows.filter(row => String(row[k]) === String(v));
    }
    if (!isServiceRole(req)) rows = rows.filter(row => rules.read(row, req.user));
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      if (cols.includes(field)) {
        rows.sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (desc ? -1 : 1));
      }
    }
    if (limit) rows = rows.slice(0, Number(limit));
    res.json(rows.map(row => deserialize(table, row)));
  });

  r.get('/:id', optionalAuth, (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!isServiceRole(req) && !rules.read(row, req.user)) return res.status(403).json({ error: 'Forbidden' });
    res.json(deserialize(table, row));
  });

  r.post('/', requireAuth, (req, res) => {
    if (!rules.create(req.body, req.user)) return res.status(403).json({ error: 'Forbidden' });
    const id = uuidv4();
    const ts = now();
    const data = serializeForWrite(table, req.body);
    const writable = cols.filter(c => !['id', 'created_date', 'updated_date'].includes(c) && c in data);
    const values = { id, created_by_id: req.user.id, created_date: ts, updated_date: ts };
    for (const c of writable) values[c] = data[c];
    const allCols = ['id', 'created_by_id', 'created_date', 'updated_date', ...writable.filter(c => c !== 'created_by_id')];
    const uniqueCols = [...new Set(allCols)];
    const placeholders = uniqueCols.map(c => `@${c}`).join(',');
    db.prepare(`INSERT INTO ${table} (${uniqueCols.join(',')}) VALUES (${placeholders})`).run(values);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);

    if (table === 'farms' && (row.declared_area_hectares != null || row.calculated_area_hectares != null)) {
      recomputeAreaMatch(db, row.id);
    }

    res.status(201).json(deserialize(table, row));
  });

  r.patch('/:id', requireAuth, (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!isServiceRole(req) && !rules.update(row, req.user)) return res.status(403).json({ error: 'Forbidden' });
    const data = serializeForWrite(table, req.body);
    const writable = cols.filter(c => !['id', 'created_by_id', 'created_date', 'updated_date'].includes(c) && c in data);
    if (writable.length) {
      const sets = writable.map(c => `${c} = @${c}`).join(', ');
      db.prepare(`UPDATE ${table} SET ${sets}, updated_date = @updated_date WHERE id = @id`)
        .run({ ...data, updated_date: now(), id: req.params.id });
    }
    const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);

    // A document review (status change) or a farm boundary edit can move a
    // farmer's real verification progress - recompute it rather than leaving
    // verification_level as a stale value only a manual admin toggle moves.
    if (table === 'documents' && 'status' in data && updated.farmer_id) {
      recomputeAndApply(db, updated.farmer_id);
    }
    if (table === 'farms' && 'boundary' in data && updated.farmer_id) {
      recomputeAndApply(db, updated.farmer_id);
    }
    if (table === 'farms' && ('declared_area_hectares' in data || 'calculated_area_hectares' in data)) {
      recomputeAreaMatch(db, updated.id);
    }

    res.json(deserialize(table, updated));
  });
  // alias PUT -> PATCH for convenience
  r.put('/:id', (req, res, next) => { req.method = 'PATCH'; r.handle(req, res, next); });

  r.delete('/:id', requireAuth, (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!isServiceRole(req) && !rules.delete(row, req.user)) return res.status(403).json({ error: 'Forbidden' });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });

  return r;
}

for (const table of Object.keys(RULES)) {
  router.use(`/${table}`, buildRouterFor(table));
}

// Users: read own or admin; update own; no public create (registration handles that)
router.get('/users', requireAuth, (req, res) => {
  const rows = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM users').all()
    : db.prepare('SELECT * FROM users WHERE id = ?').all(req.user.id);
  res.json(rows.map(({ password_hash, google_id, ...u }) => ({ ...u, verified_farmer: !!u.verified_farmer })));
});

router.patch('/users/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const allowed = ['full_name', 'phone', 'village', 'district', 'state', 'country', 'preferred_language',
    'date_of_birth', 'bio', 'farming_since', 'avatar_url', 'account_type', 'verification_level', 'verified_farmer', 'role'];
  const isAdmin = req.user.role === 'admin';
  const sets = [], vals = {};
  for (const k of allowed) {
    if (['verification_level', 'verified_farmer', 'role'].includes(k) && !isAdmin) continue;
    if (k in req.body) { sets.push(`${k} = @${k}`); vals[k] = k === 'verified_farmer' ? (req.body[k] ? 1 : 0) : req.body[k]; }
  }
  if (sets.length) {
    vals.updated_date = now(); vals.id = req.params.id;
    db.prepare(`UPDATE users SET ${sets.join(', ')}, updated_date = @updated_date WHERE id = @id`).run(vals);
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  const { password_hash, google_id, ...u } = row;
  res.json({ ...u, verified_farmer: !!u.verified_farmer });
});

export default router;
