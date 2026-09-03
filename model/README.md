# model/

Assets for the AI-generated-image detector used by `ai-image-detector/`
(see that folder's README for how the worker uses these).

## Files

- **`ai_image_detector.ipynb`** — the training notebook, taken from
  [guyfloki/ai-image-detector](https://github.com/guyfloki/ai-image-detector)
  (Apache-2.0). Fine-tunes `microsoft/cvt-13` (CvT-13) with a small custom
  classifier head to tell real photos from AI-generated ones. Run in Colab
  (there's a badge at the top of the notebook) or locally with a GPU;
  produces a `model_epoch_N.pth` checkpoint per epoch.
- **`model_epoch_24.pth`** *(gitignored, ~227MB)* — the trained checkpoint
  actually used by `ai-image-detector/detector_worker.py` in this project.
  Too large for Git (and not ours to redistribute) — see below to get one.
- **`financial_transaction_reconciliation.ipynb`** — an earlier copy of the
  reconciliation notebook; the maintained version lives in
  [`../reconciliation/notebooks/`](../reconciliation/notebooks/), see
  [`../reconciliation/README.md`](../reconciliation/README.md).

## Getting `model_epoch_24.pth`

You have two options:

1. **Train your own** — run `ai_image_detector.ipynb` against a real-vs-AI
   image dataset (the notebook's "DOWNLOAD ZIP AND CSV" cell points at the
   one it was built against) and point
   `AI_DETECTOR_WEIGHTS_DIR` (`server/.env`) at wherever your
   `model_epoch_*.pth` lands — `detector_worker.py` picks the most recent
   `model_epoch_*.pth` in that folder automatically (`glob` + `getctime`).
2. **Skip it** — set `AI_DETECTOR_ENABLED=false` in `server/.env`. Uploads
   still work and OCR still runs; only the AI-generated-image fraud signal
   is disabled, exactly like `OCR_ENABLED=false` disables OCR alone.
