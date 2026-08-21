"""
Document type detection from OCR'd text: aadhaar | kisan_card | other.

`other` means "not an identity document we have a structured extractor
for" — the caller falls through to the existing land-document regex path
for that case, unchanged.
"""
import re

_AADHAAR_HINTS = re.compile(
    r"(?:aadhaar|aadhar|आधार|unique\s*identification\s*authority|uidai)", re.I
)
_AADHAAR_NUMBER_SHAPE = re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)")

_KISAN_HINTS = re.compile(
    r"(?:kisan\s*(?:credit\s*)?card|kcc|किसान\s*क्रेडिट\s*कार्ड|किसान\s*कार्ड)", re.I
)


def detect(text: str) -> str:
    # Explicit label keywords take priority over shape-only signals, so a
    # Kisan Card that happens to also print a 12-digit account/IFSC-adjacent
    # number isn't misclassified as Aadhaar.
    if _AADHAAR_HINTS.search(text):
        return "aadhaar"
    if _KISAN_HINTS.search(text):
        return "kisan_card"
    if _AADHAAR_NUMBER_SHAPE.search(text):
        return "aadhaar"
    return "other"
