// Automated version of the "Satellite & map validation" pipeline step.
// Real satellite imagery analysis needs a paid third-party API and would
// break this app's local-only design - what we *can* do locally is compare
// the two area numbers the farm record already carries: what the farmer
// declared vs. what was calculated from the boundary polygon they drew.
// A large gap between them is exactly the kind of thing that step exists to
// catch, without any network call.
import { uuidv4 } from '../db.js';

const PASS_THRESHOLD = 0.15; // within 15% - looks consistent
const FLAG_THRESHOLD = 0.35; // 15-35% - worth a human look; beyond that, fail

export function evaluateAreaMatch(declared, calculated) {
  if (!declared || !calculated || declared <= 0 || calculated <= 0) return null;
  const ratio = Math.abs(declared - calculated) / declared;
  if (ratio <= PASS_THRESHOLD) return { result: 'pass', ratio };
  if (ratio <= FLAG_THRESHOLD) return { result: 'flag', ratio };
  return { result: 'fail', ratio };
}

export function recomputeAreaMatch(db, farmId) {
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId);
  if (!farm) return null;
  const outcome = evaluateAreaMatch(farm.declared_area_hectares, farm.calculated_area_hectares);
  if (!outcome) return null;

  const pct = Math.round(outcome.ratio * 100);
  const notes = `Declared ${farm.declared_area_hectares} ha vs. mapped ${farm.calculated_area_hectares} ha (${pct}% difference).`;
  const flagged_issues = outcome.result === 'pass' ? '[]' : JSON.stringify([`Declared/mapped area differ by ${pct}%`]);

  const existing = db.prepare(
    `SELECT id FROM verification_checks WHERE farm_id = ? AND check_type = 'area_match'`
  ).get(farmId);
  const ts = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE verification_checks SET result = ?, notes = ?, flagged_issues = ?, updated_date = ? WHERE id = ?`
    ).run(outcome.result, notes, flagged_issues, ts, existing.id);
  } else {
    db.prepare(`INSERT INTO verification_checks
      (id, created_by_id, farmer_id, farmer_name, farm_id, farm_name, check_type, result, notes, flagged_issues, created_date, updated_date)
      VALUES (?,?,?,?,?,?, 'area_match', ?, ?, ?, ?, ?)`
    ).run(uuidv4(), farm.created_by_id, farm.farmer_id, farm.farmer_name, farm.id, farm.farm_name, outcome.result, notes, flagged_issues, ts, ts);
  }
  return outcome.result;
}
