import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/authenticate.js';
import { runOcr } from '../ocr/ocrClient.js';
import { runAiDetector } from '../ocr/aiDetectorClient.js';

const router = Router();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const OCR_EXTS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff']);
// AI-generated-image check needs a raster image (PIL.Image.open) - no PDFs.
const AI_DETECT_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff']);

// Matches api.integrations.Core.UploadFile({ file }) -> { file_url }
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const file_url = `/uploads/${req.file.filename}`;
  const absPath = path.join(UPLOAD_DIR, req.file.filename);
  const ext = path.extname(req.file.originalname).toLowerCase();

  const runOcrCheck = OCR_EXTS.has(ext) && String(req.query.ocr) !== 'skip';
  const runAiCheck = AI_DETECT_EXTS.has(ext) && String(req.query.ai_check) !== 'skip';

  const [ocr, ai_check] = await Promise.all([
    runOcrCheck ? runOcr(absPath) : Promise.resolve(null),
    runAiCheck ? runAiDetector(absPath) : Promise.resolve(null),
  ]);

  res.json({ file_url, file_name: req.file.originalname, ocr, ai_check });
});

// Matches api.integrations.Core.CreateFileSignedUrl({ file_uri }) -> { signed_url }
// Local storage has no real signing; this just resolves to the servable path,
// gated behind auth so it isn't a fully open static mount for private docs.
router.post('/signed-url', requireAuth, (req, res) => {
  const { file_uri } = req.body || {};
  if (!file_uri) return res.status(400).json({ error: 'file_uri required' });
  res.json({ signed_url: file_uri.startsWith('http') ? file_uri : `${req.protocol}://${req.get('host')}${file_uri}` });
});

export default router;
