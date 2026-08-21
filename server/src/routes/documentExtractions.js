import { Router } from 'express';
import { db, uuidv4 } from '../db.js';
import { requireAuth } from '../middleware/authenticate.js';

const router = Router();
const now = () => new Date().toISOString();

function getDocument(id) {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

function canAccessDocument(doc, user) {
  return !!doc && (doc.created_by_id === user.id || user.role === 'admin');
}

// POST /api/document-extractions — persists the structured (masked-only)
// output of the identity-document OCR pipeline. Only ever receives already-
// masked aadhaar_number/kisan_card_number values (see python-ocr/extraction/
// aadhaar.py + kisan_card.py) — there is no full number to redact here.
router.post('/', requireAuth, (req, res) => {
  const { document_id, extraction } = req.body || {};
  if (!document_id || !extraction) return res.status(400).json({ error: 'document_id and extraction are required' });

  const doc = getDocument(document_id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!canAccessDocument(doc, req.user)) return res.status(403).json({ error: 'Forbidden' });

  const { document_type, farmer = {}, verification = {} } = extraction;
  const id = uuidv4();
  const ts = now();

  db.prepare(`INSERT INTO document_extractions (
    id, document_id, farmer_id, document_type,
    name, address, village, taluka, district, state, pincode,
    kisan_card_number_masked, aadhaar_number_masked, aadhaar_checksum_valid,
    ocr_confidence, fields_found, fields_missing, requires_manual_review, created_date
  ) VALUES (
    @id, @document_id, @farmer_id, @document_type,
    @name, @address, @village, @taluka, @district, @state, @pincode,
    @kisan_card_number_masked, @aadhaar_number_masked, @aadhaar_checksum_valid,
    @ocr_confidence, @fields_found, @fields_missing, @requires_manual_review, @created_date
  )`).run({
    id,
    document_id,
    farmer_id: doc.farmer_id,
    document_type: document_type || 'other',
    name: farmer.name || null,
    address: farmer.address || null,
    village: farmer.village || null,
    taluka: farmer.taluka || null,
    district: farmer.district || null,
    state: farmer.state || null,
    pincode: farmer.pincode || null,
    kisan_card_number_masked: farmer.kisan_card_number || null,
    aadhaar_number_masked: farmer.aadhaar_number || null,
    aadhaar_checksum_valid: typeof verification.aadhaar_checksum_valid === 'boolean' ? (verification.aadhaar_checksum_valid ? 1 : 0) : null,
    ocr_confidence: verification.ocr_confidence ?? null,
    fields_found: JSON.stringify(verification.fields_found || []),
    fields_missing: JSON.stringify(verification.fields_missing || []),
    requires_manual_review: verification.requires_manual_review === false ? 0 : 1, // default true, matches worker's own default
    created_date: ts,
  });

  // Keep the existing documents.ocr_extracted column populated too, with a
  // PII-free summary only — the structured fields live exclusively in
  // document_extractions above.
  db.prepare('UPDATE documents SET ocr_extracted = ?, updated_date = ? WHERE id = ?').run(
    JSON.stringify({ document_type: document_type || 'other', requires_manual_review: verification.requires_manual_review !== false, ocr_confidence: verification.ocr_confidence ?? null }),
    ts,
    document_id
  );

  const row = db.prepare('SELECT * FROM document_extractions WHERE id = ?').get(id);
  res.status(201).json({
    ...row,
    fields_found: JSON.parse(row.fields_found || '[]'),
    fields_missing: JSON.parse(row.fields_missing || '[]'),
    aadhaar_checksum_valid: row.aadhaar_checksum_valid === null ? null : !!row.aadhaar_checksum_valid,
    requires_manual_review: !!row.requires_manual_review,
  });
});

// GET /api/document-extractions/:documentId — only ever returns masked
// fields (that's all that's ever stored, see the table comment in db.js),
// so no additional redaction is needed here beyond the ownership check.
router.get('/:documentId', requireAuth, (req, res) => {
  const doc = getDocument(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!canAccessDocument(doc, req.user)) return res.status(403).json({ error: 'Forbidden' });

  const row = db.prepare('SELECT * FROM document_extractions WHERE document_id = ? ORDER BY created_date DESC LIMIT 1').get(req.params.documentId);
  if (!row) return res.status(404).json({ error: 'No extraction found for this document' });

  res.json({
    ...row,
    fields_found: JSON.parse(row.fields_found || '[]'),
    fields_missing: JSON.parse(row.fields_missing || '[]'),
    aadhaar_checksum_valid: row.aadhaar_checksum_valid === null ? null : !!row.aadhaar_checksum_valid,
    requires_manual_review: !!row.requires_manual_review,
  });
});

export default router;
