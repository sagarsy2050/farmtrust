import { spawn } from 'node:child_process';
import path from 'node:path';

const WORKER_DIR = path.resolve(process.env.OCR_WORKER_DIR || '../python-ocr');
const PYTHON_BIN = process.env.PYTHON_BIN || 'uv';
const ENABLED = String(process.env.OCR_ENABLED || 'true') === 'true';

/**
 * Runs the Python OCR worker (pytesseract + PyMuPDF + OpenCV) against a file
 * and returns structured JSON on stdout. Mirrors the CommerceFlow subprocess
 * pattern: Node orchestrates, Python does image/PDF preprocessing + OCR.
 * Never throws — OCR is best-effort enrichment, not a blocker for uploads.
 */
export function runOcr(filePath) {
  if (!ENABLED) return Promise.resolve({ ok: false, reason: 'ocr_disabled' });

  return new Promise((resolve) => {
    const args = ['run', 'ocr_worker.py', filePath];
    const child = spawn(PYTHON_BIN, args, { cwd: WORKER_DIR });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, reason: 'timeout' });
    }, 60_000);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        console.error('[ocr] worker failed:', stderr.slice(0, 2000));
        return resolve({ ok: false, reason: 'worker_error', detail: stderr.slice(0, 500) });
      }
      try {
        // IMPORTANT: worker must ONLY write JSON to stdout (see PyMuPDF `import fitz`
        // aliasing note in ocr_worker.py) — any stray print() corrupts this parse.
        resolve({ ok: true, ...JSON.parse(stdout.trim()) });
      } catch (e) {
        resolve({ ok: false, reason: 'bad_json', detail: stdout.slice(0, 500) });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, reason: 'spawn_error', detail: err.message });
    });
  });
}
