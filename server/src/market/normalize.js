// Central unit-conversion table for market-price normalization. Mandi/APMC
// prices are commonly reported per quintal (100kg); this app always displays
// ₹/kg, so every source unit must convert cleanly through this table.
// Unknown units are NOT guessed — convertToKg returns null and the caller
// must quarantine the record rather than display a fabricated ₹/kg value.
export const UNIT_TO_KG = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
  ton: 1000,
};

export function convertToKg(price, sourceUnit) {
  if (price == null || Number.isNaN(Number(price))) return null;
  const factor = UNIT_TO_KG[String(sourceUnit || '').toLowerCase()];
  if (!factor) return null;
  return Number(price) / factor;
}

// Validates a normalized min/modal/max triple. Per spec: min <= modal <= max.
// Returns { valid: true } or { valid: false, reason } — callers quarantine
// (never publish) a record that fails this check.
export function validateRecord({ minPriceKg, modalPriceKg, maxPriceKg }) {
  if (minPriceKg == null || modalPriceKg == null || maxPriceKg == null) {
    return { valid: false, reason: 'missing_price_field' };
  }
  if (!(minPriceKg <= modalPriceKg && modalPriceKg <= maxPriceKg)) {
    return { valid: false, reason: 'min_modal_max_out_of_order' };
  }
  if (minPriceKg < 0) {
    return { valid: false, reason: 'negative_price' };
  }
  return { valid: true };
}
