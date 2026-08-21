import { spawn } from 'node:child_process';
import path from 'node:path';

const WORKER_DIR = path.resolve(process.env.AI_DETECTOR_WORKER_DIR || '../ai-image-detector');
const WEIGHTS_DIR = path.resolve(process.env.AI_DETECTOR_WEIGHTS_DIR || '../model');
const PYTHON_BIN = process.env.PYTHON_BIN || 'uv';
const ENABLED = String(process.env.AI_DETECTOR_ENABLED || 'true') === 'true';

/**
 * Runs the CvT-13 AI-generated-image detector (guyfloki/ai-image-detector
 * checkpoint) against an uploaded image and returns structured JSON on
 * stdout. Mirrors ocrClient.js's subprocess pattern. Never throws -
 * this is best-effort fraud-signal enrichment, not a blocker for uploads.
 */
export function runAiDetector(filePath) {
  if (!ENABLED) return Promise.resolve({ ok: false, reason: 'ai_detector_disabled' });

  return new Promise((resolve) => {
    const args = ['run', 'detector_worker.py', filePath, '--weights_folder', WEIGHTS_DIR];
    const child = spawn(PYTHON_BIN, args, { cwd: WORKER_DIR });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    // First invocation loads CvT-13's base config via the transformers cache
    // (network on first run only, then cached) and runs a model load + one
    // forward pass - budget more time than OCR's 60s.
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, reason: 'timeout' });
    }, 120_000);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        console.error('[ai-detector] worker failed:', stderr.slice(0, 2000));
        return resolve({ ok: false, reason: 'worker_error', detail: stderr.slice(0, 500) });
      }
      try {
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
