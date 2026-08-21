"""
Aadhaar number detection, Verhoeff checksum validation, and masking.

HARD RULE: the full 12-digit number is only ever held in a local variable
long enough to checksum-validate and mask it. It is never returned, never
logged, never written anywhere. Only `mask_aadhaar()`'s output
("XXXX-XXXX-1234") and the boolean checksum result leave this module.
"""
import re

# Verhoeff multiplication table.
_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
# Verhoeff permutation table.
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

# Matches a 12-digit Aadhaar number as commonly OCR'd: either space/hyphen
# grouped in 4s ("1234 5678 9012") or run together (12 consecutive digits).
_AADHAAR_PATTERN = re.compile(r"(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)")


def verhoeff_validate(number_str: str) -> bool:
    """Standard Verhoeff checksum validation over the full digit string
    (the 12th digit is Aadhaar's built-in check digit, validated in place,
    not separately)."""
    if not number_str.isdigit():
        return False
    c = 0
    for i, item in enumerate(reversed(number_str)):
        c = _D[c][_P[i % 8][int(item)]]
    return c == 0


def mask_aadhaar(number_str: str) -> str:
    """'123456789012' -> 'XXXX-XXXX-9012'. Only the last 4 digits are ever
    shown, per UIDAI's own masking convention."""
    digits = re.sub(r"\D", "", number_str)
    if len(digits) != 12:
        return "XXXX-XXXX-XXXX"
    return f"XXXX-XXXX-{digits[-4:]}"


def find_aadhaar(text: str):
    """
    Scans OCR'd text for an Aadhaar-shaped number, validates it, and
    returns only the masked form + checksum result — never the raw digits.

    Returns dict: {"masked": str, "checksum_valid": bool} or None if no
    12-digit candidate was found at all.
    """
    match = _AADHAAR_PATTERN.search(text)
    if not match:
        return None
    raw = match.group(1)
    digits = re.sub(r"\D", "", raw)  # local only — discarded when this function returns
    if len(digits) != 12:
        return None
    result = {
        "masked": mask_aadhaar(digits),
        "checksum_valid": verhoeff_validate(digits),
    }
    del digits  # explicit: full number does not outlive this function
    del raw
    return result
