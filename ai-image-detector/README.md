# ai-image-detector

The FarmTrust worker that flags AI-generated document photos at upload
time — a second, independent fraud signal alongside OCR. Runs as a `uv`-
managed Python subprocess, invoked by the Node server exactly the way
`python-ocr/` is (see `server/src/ocr/aiDetectorClient.js`).

## What it does

`detector_worker.py <image_path> --weights_folder <dir>` loads a CvT-13
transformer with a small custom classifier head (`model.py`), runs one
forward pass on the image, and prints a single JSON line to stdout:

```json
{
  "label": "fake",
  "ai_generated": true,
  "confidence": 0.998,
  "probabilities": { "real": 0.002, "fake": 0.998 }
}
```

Everything else (progress bars, HF Hub warnings, model-load logging) is
redirected to stderr — the same stdout-is-JSON-only contract `ocr_worker.py`
uses, and for the same reason: a stray `print()` from a dependency would
corrupt the payload the Node parent process parses.

## Model & attribution

The CvT-13 architecture, classifier head, and training notebook
(`model/ai_image_detector.ipynb`) are copied from
[guyfloki/ai-image-detector](https://github.com/guyfloki/ai-image-detector)
(Apache-2.0), which fine-tunes `microsoft/cvt-13` (also Apache-2.0, via
Hugging Face `transformers`) to classify real vs. AI-generated images.
`model.py` here is that same architecture, kept byte-for-byte compatible
with the trained checkpoint's layer shapes/names — `load_state_dict` is
shape- and key-strict, so don't change it without retraining.

The trained weights (`../model/model_epoch_24.pth`, ~227MB) were produced
by running that notebook and are **not** committed to this repo (too large
for Git, and not this project's to redistribute) — see
[`../model/README.md`](../model/README.md) for how to obtain or retrain them.
Everything else in this directory (`detector_worker.py`'s subprocess
contract, JSON shape, stdout/stderr discipline, and its wiring into
FarmTrust's upload pipeline) is original to this project.

## Running it standalone

```bash
cd ai-image-detector
uv sync
uv run detector_worker.py /path/to/image.jpg --weights_folder ../model
```

First run needs network access once, to fetch the `microsoft/cvt-13` base
config via `transformers` (cached under `~/.cache/huggingface` after that).
