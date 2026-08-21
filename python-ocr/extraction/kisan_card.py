"""
Kisan (Credit) Card number detection and masking.

Unlike Aadhaar, KCC account numbers have no public standard checksum
algorithm — banks issue them under their own numbering schemes. We only
detect a plausible candidate (a long digit run near a "Kisan"/"KCC" label)
and mask it the same way (last 4 characters visible), never validate a
checksum that doesn't exist.
"""
import re

_LABEL_PATTERN = re.compile(
    r"(?:kisan\s*(?:credit\s*)?card|kcc|किसान\s*क्रेडिट\s*कार्ड|किसान\s*कार्ड)"
    r"[^\d]{0,30}(\d[\d\s-]{7,20}\d)",
    re.I,
)
# Fallback: a bare 10-16 digit run, used only if no labeled match is found.
_BARE_NUMBER_PATTERN = re.compile(r"(?<!\d)(\d{10,16})(?!\d)")


def mask_generic(number_str: str) -> str:
    """Keeps only the last 4 characters visible, same convention as Aadhaar
    masking — 'XXXXXXXX1234'."""
    digits = re.sub(r"\D", "", number_str)
    if len(digits) < 4:
        return "X" * max(len(digits), 4)
    return ("X" * (len(digits) - 4)) + digits[-4:]


def find_kisan_card_number(text: str):
    """Returns {"masked": str} or None. Full number is a local-only
    variable, discarded immediately after masking — never returned."""
    match = _LABEL_PATTERN.search(text)
    if not match:
        match = _BARE_NUMBER_PATTERN.search(text)
    if not match:
        return None
    raw_digits = re.sub(r"\D", "", match.group(1))
    if len(raw_digits) < 6:
        return None
    result = {"masked": mask_generic(raw_digits)}
    del raw_digits
    return result
