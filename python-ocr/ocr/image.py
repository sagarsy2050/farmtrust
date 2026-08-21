"""
Image preprocessing shared by the PDF and plain-image OCR paths.

Factored out of ocr_worker.py verbatim — behavior is unchanged from the
original inline function, just relocated.
"""


def preprocess(cv2, np, img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
    )
    return thresh
