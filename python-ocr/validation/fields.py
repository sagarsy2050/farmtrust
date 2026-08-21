"""
Field completeness + confidence scoring + manual-review gating.

This module never treats OCR output as proof of anything — it only scores
how much of what we expected to find was actually found, and how confident
Tesseract itself was. requires_manual_review defaults to True and is only
ever False when both signals are strong; even then, this is a *supporting*
signal for a human reviewer, never an auto-approve gate (nothing in this
codebase wires it to auto-approve — see server/src/routes/documentExtractions.js).
"""

REQUIRED_FIELDS = {
    "aadhaar": ["name", "address", "pincode"],
    "kisan_card": ["name", "village", "district", "state"],
}

CONFIDENCE_REVIEW_THRESHOLD = 70.0  # Tesseract mean word confidence, 0-100


def evaluate(document_type: str, farmer_fields: dict, id_number_result, ocr_confidence: float) -> dict:
    """
    farmer_fields: dict from extraction/farmer.py (name/address/village/...).
    id_number_result: the aadhaar/kisan_card find_*() result (or None) —
      only used here to check presence/checksum, never the raw number.
    """
    required = REQUIRED_FIELDS.get(document_type, [])
    fields_found = [f for f in required if farmer_fields.get(f)]
    fields_missing = [f for f in required if not farmer_fields.get(f)]

    if document_type == "aadhaar":
        if id_number_result:
            fields_found.append("aadhaar_number")
        else:
            fields_missing.append("aadhaar_number")
    elif document_type == "kisan_card":
        if id_number_result:
            fields_found.append("kisan_card_number")
        else:
            fields_missing.append("kisan_card_number")

    checksum_failed = (
        document_type == "aadhaar"
        and id_number_result is not None
        and id_number_result.get("checksum_valid") is False
    )
    # Computed for future tightening (e.g. once a real reviewer-approval
    # audit trail exists), but always True for now — see module docstring.
    # An automated "looks fine" signal must never stand in for a human.
    _would_pass_automated_checks = (
        len(fields_missing) == 0
        and ocr_confidence >= CONFIDENCE_REVIEW_THRESHOLD
        and not checksum_failed
    )
    requires_manual_review = True

    return {
        "ocr_confidence": round(ocr_confidence, 1),
        "fields_found": fields_found,
        "fields_missing": fields_missing,
        "requires_manual_review": requires_manual_review,
    }
