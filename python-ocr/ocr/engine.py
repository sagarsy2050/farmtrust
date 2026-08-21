"""
Tesseract invocation. Identity documents (Aadhaar/Kisan Card) OCR with
English+Hindi+Marathi since farmer-facing Indian documents mix scripts;
the existing land-document path keeps using English-only (unchanged
behavior, avoids slowing down/regressing the already-working path).
"""

IDENTITY_LANGS = "eng+hin+mar"
DEFAULT_LANGS = "eng"


def ocr_text(pytesseract, image, lang=DEFAULT_LANGS):
    return pytesseract.image_to_string(image, lang=lang)


def ocr_text_with_confidence(pytesseract, image, lang=DEFAULT_LANGS):
    """
    Returns (text, mean_confidence_0_100). Uses image_to_data to get
    Tesseract's own per-word confidence scores rather than guessing —
    confidence -1 entries (non-text regions) are excluded from the mean.
    """
    data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
    text = " ".join(w for w in data.get("text", []) if w.strip())
    confidences = [int(c) for c in data.get("conf", []) if str(c).lstrip("-").isdigit() and int(c) >= 0]
    mean_conf = (sum(confidences) / len(confidences)) if confidences else 0.0
    return text, mean_conf
