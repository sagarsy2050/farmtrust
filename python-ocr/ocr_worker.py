"""
FarmTrust OCR worker.

Invoked by the Node server as: uv run ocr_worker.py <file_path>
Preprocesses a document (PDF or image) and runs Tesseract OCR. Two paths:
  - Identity documents (Aadhaar / Kisan Card): detected from the OCR'd text,
    then structured field extraction + Verhoeff checksum (Aadhaar only) +
    masking runs via extraction/*, validation/fields.py, models/farmer.py.
    Full Aadhaar/Kisan Card numbers never leave extraction/aadhaar.py or
    extraction/kisan_card.py — only masked forms cross this boundary.
  - Everything else: falls through to the original light-touch regex
    extraction for land-document fields (survey number/area/village/name),
    unchanged from before this file was restructured.

CONTRACT: stdout carries ONLY the final json.dumps(...) payload. Everything
else (progress, warnings, library chatter) goes to stderr. This burned us
before in CommerceFlow: `import fitz` (PyMuPDF) plus any stray print() from
a dependency corrupts the JSON the Node side parses from stdout. Do not
relax this.
"""
import sys
import os
import json
import re
import contextlib
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ocr.image import preprocess as preprocess_image
from ocr.pdf import pages_to_images
from ocr.engine import ocr_text, ocr_text_with_confidence, IDENTITY_LANGS, DEFAULT_LANGS
from extraction.document_type import detect as detect_document_type
from extraction.farmer import extract as extract_farmer_fields
from extraction.aadhaar import find_aadhaar
from extraction.kisan_card import find_kisan_card_number
from validation.fields import evaluate as evaluate_verification
from models.farmer import build_result as build_identity_result


def _log(msg):
    print(msg, file=sys.stderr)


# ---- Original land-document regex path (unchanged) ----
def extract_fields(text: str) -> dict:
    fields = {}

    survey_no = re.search(r"(?:survey|khasra|gat)\s*(?:no\.?|number)?\s*[:\-]?\s*([A-Za-z0-9/\-]+)", text, re.I)
    if survey_no:
        fields["survey_number"] = survey_no.group(1).strip()

    area = re.search(r"([\d.,]+)\s*(hectare|hect\.?|acre|acres|guntha)", text, re.I)
    if area:
        fields["area_value"] = area.group(1).strip()
        fields["area_unit"] = area.group(2).lower()

    village = re.search(r"(?:village|gram)\s*[:\-]?\s*([A-Za-zऀ-ॿ\s]{2,40})", text, re.I)
    if village:
        fields["village"] = village.group(1).strip()

    name = re.search(r"(?:owner|farmer|name)\s*[:\-]?\s*([A-Za-zऀ-ॿ\s]{2,60})", text, re.I)
    if name:
        fields["name_candidate"] = name.group(1).strip()

    return fields


def _quick_scan_text(file_path: str, ext: str, cv2, np, pytesseract) -> str:
    """First-pass OCR (English only, fast) purely to decide which detailed
    path to take. The detailed path re-OCRs with the right language set."""
    texts = []
    if ext == ".pdf":
        for img in pages_to_images(file_path, cv2, np, max_pages=1):
            processed = preprocess_image(cv2, np, img)
            texts.append(ocr_text(pytesseract, processed, lang=DEFAULT_LANGS))
    else:
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not read image: {file_path}")
        processed = preprocess_image(cv2, np, img)
        texts.append(ocr_text(pytesseract, processed, lang=DEFAULT_LANGS))
    return "\n".join(texts)


def run(file_path: str) -> dict:
    import cv2
    import numpy as np
    import pytesseract

    ext = os.path.splitext(file_path)[1].lower()

    # Pass 1: quick English-only OCR to classify the document.
    quick_text = _quick_scan_text(file_path, ext, cv2, np, pytesseract)
    doc_type = detect_document_type(quick_text)

    if doc_type in ("aadhaar", "kisan_card"):
        # Pass 2: re-OCR with eng+hin+mar and per-word confidence, since
        # identity documents commonly mix scripts.
        full_text_parts = []
        confidences = []
        if ext == ".pdf":
            page_count = 0
            for img in pages_to_images(file_path, cv2, np, max_pages=5):
                processed = preprocess_image(cv2, np, img)
                text, conf = ocr_text_with_confidence(pytesseract, processed, lang=IDENTITY_LANGS)
                full_text_parts.append(text)
                confidences.append(conf)
                page_count += 1
        else:
            img = cv2.imread(file_path)
            processed = preprocess_image(cv2, np, img)
            text, conf = ocr_text_with_confidence(pytesseract, processed, lang=IDENTITY_LANGS)
            full_text_parts.append(text)
            confidences.append(conf)
            page_count = 1

        full_text = "\n".join(full_text_parts).strip()
        mean_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        farmer_fields = extract_farmer_fields(full_text)
        aadhaar_result = find_aadhaar(full_text) if doc_type == "aadhaar" else None
        kisan_result = find_kisan_card_number(full_text) if doc_type == "kisan_card" else None

        verification = evaluate_verification(doc_type, farmer_fields, aadhaar_result or kisan_result, mean_confidence)
        identity_result = build_identity_result(doc_type, farmer_fields, aadhaar_result, kisan_result, verification)

        return {
            **identity_result,
            "text_preview": full_text[:1500],
            "page_count": page_count,
        }

    # Fallback: original land-document path, unchanged.
    pages_text = []
    if ext == ".pdf":
        for img in pages_to_images(file_path, cv2, np, max_pages=5):
            processed = preprocess_image(cv2, np, img)
            pages_text.append(ocr_text(pytesseract, processed, lang=DEFAULT_LANGS))
    else:
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not read image: {file_path}")
        processed = preprocess_image(cv2, np, img)
        pages_text.append(ocr_text(pytesseract, processed, lang=DEFAULT_LANGS))

    full_text = "\n".join(pages_text).strip()
    fields = extract_fields(full_text)

    return {
        "document_type": "other",
        "text_preview": full_text[:1500],
        "page_count": len(pages_text),
        "extracted_fields": fields,
        "confidence_note": "regex-based extraction; treat as supporting evidence only",
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "file path argument required"}))
        sys.exit(1)

    file_path = sys.argv[1]

    # Swallow any stray stdout writes from third-party libs during processing
    # so only our final json.dumps reaches the parent process.
    captured = io.StringIO()
    try:
        with contextlib.redirect_stdout(captured):
            result = run(file_path)
    except Exception as e:
        _log(f"ocr_worker error: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    leaked = captured.getvalue()
    if leaked.strip():
        _log(f"[warn] suppressed stray stdout from OCR deps: {leaked[:300]!r}")

    print(json.dumps(result))


if __name__ == "__main__":
    main()
