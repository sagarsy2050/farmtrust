// Derives a farmer's verification_level from what's actually been approved,
// instead of leaving it as a purely manual admin toggle. See the "Designed
// vs. built" gap in the payment-admission runbook: the schema has always
// supported five stages (none/identity/location/documents/fully_verified)
// but nothing computed them from real state until this.
//
// Rules, matching the "How FarmTrust verification works" steps:
//   identity  - an approved document_type='identity_proof' (Aadhaar/Kisan Card)
//   location  - the farmer's farm has a drawn boundary polygon
//   documents - an approved land_ownership or lease_tenancy document
//   fully_verified - identity AND location AND documents all satisfied
export function computeVerificationLevel(db, farmerId) {
  const approvedOfType = (type) => db.prepare(
    `SELECT COUNT(*) as n FROM documents WHERE farmer_id = ? AND document_type = ? AND status = 'approved'`
  ).get(farmerId, type).n > 0;

  const identity = approvedOfType('identity_proof');
  const landDocs = approvedOfType('land_ownership') || approvedOfType('lease_tenancy');
  const hasBoundary = db.prepare(
    `SELECT COUNT(*) as n FROM farms WHERE farmer_id = ? AND boundary IS NOT NULL AND boundary != '[]'`
  ).get(farmerId).n > 0;

  if (identity && hasBoundary && landDocs) return 'fully_verified';
  if (identity && landDocs) return 'documents';
  if (identity && hasBoundary) return 'location';
  if (identity) return 'identity';
  return 'none';
}

// Recomputes and writes verification_level (+ the verified_farmer flag,
// kept in sync as a plain boolean of "level === fully_verified"). Called
// after any document review or farm-boundary change; a no-op query if the
// level hasn't actually moved.
export function recomputeAndApply(db, farmerId) {
  const user = db.prepare('SELECT id, verification_level FROM users WHERE id = ?').get(farmerId);
  if (!user) return null;
  const level = computeVerificationLevel(db, farmerId);
  if (level !== user.verification_level) {
    db.prepare('UPDATE users SET verification_level = ?, verified_farmer = ?, updated_date = ? WHERE id = ?')
      .run(level, level === 'fully_verified' ? 1 : 0, new Date().toISOString(), farmerId);
  }
  return level;
}
