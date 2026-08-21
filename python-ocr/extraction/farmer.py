"""
Farmer identity-field extraction (name/address/village/taluka/district/
state/pincode) from OCR'd text, with English/Hindi/Marathi label patterns.

These are heuristic regex matches against noisy OCR output — not a
guarantee of correctness. Confidence/requires_manual_review (see
validation/fields.py) is what tells the caller how much to trust this.
"""
import re

# Devanagari range covers both Hindi and Marathi text (they share the
# script); label words differ between the two languages so both are listed
# explicitly per field.
_NAME_RE = re.compile(r"(?:name|नाम|नाव)\s*[:\-]?\s*([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{2,60})", re.I)
_VILLAGE_RE = re.compile(r"(?:village|गांव|गाव|ग्राम)\s*[:\-]?\s*([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{2,40})", re.I)
_TALUKA_RE = re.compile(r"(?:taluka|tehsil|तालुका|तहसील)\s*[:\-]?\s*([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{2,40})", re.I)
_DISTRICT_RE = re.compile(r"(?:district|जिला|जिल्हा)\s*[:\-]?\s*([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{2,40})", re.I)
_STATE_RE = re.compile(r"(?:state|राज्य)\s*[:\-]?\s*([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{2,40})", re.I)
_PINCODE_RE = re.compile(r"(?:pin\s*code|pincode|pin|पिन\s*कोड|पिनकोड)\s*[:\-]?\s*(\d{6})", re.I)
_ADDRESS_RE = re.compile(r"(?:address|पता|पत्ता)\s*[:\-]?\s*([A-Za-z0-9ऀ-ॿ][A-Za-z0-9ऀ-ॿ ,./#-]{5,120})", re.I)

_FIELD_PATTERNS = {
    "name": _NAME_RE,
    "address": _ADDRESS_RE,
    "village": _VILLAGE_RE,
    "taluka": _TALUKA_RE,
    "district": _DISTRICT_RE,
    "state": _STATE_RE,
    "pincode": _PINCODE_RE,
}


def extract(text: str) -> dict:
    """Returns {"name": "", "address": "", ...} — empty string for any
    field not found (never None, to match the caller's target JSON shape)."""
    fields = {}
    for key, pattern in _FIELD_PATTERNS.items():
        match = pattern.search(text)
        fields[key] = match.group(1).strip() if match else ""
    return fields
