"""
PDF -> page images, via PyMuPDF.

`fitz` is PyMuPDF's import name, aliased on import — see the note in
ocr_worker.py's module docstring about why a bare `import fitz` is banned in
this codebase (a stray print from a misbehaving dependency can corrupt the
stdout=JSON contract the Node parent process relies on).
"""


def pages_to_images(file_path, cv2, np, max_pages=5):
    """Yields BGR numpy images, one per PDF page (capped at max_pages)."""
    import fitz as pymupdf

    doc = pymupdf.open(file_path)
    try:
        count = min(len(doc), max_pages)
        for i in range(count):
            page = doc[i]
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            if pix.n == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            elif pix.n == 1:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            yield img
    finally:
        doc.close()
