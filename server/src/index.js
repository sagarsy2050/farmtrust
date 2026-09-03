import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import passport from 'passport';

import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import uploadRoutes from './routes/upload.js';
import functionRoutes from './routes/functions.js';
import marketPriceRoutes from './routes/marketPrices.js';
import documentExtractionRoutes from './routes/documentExtractions.js';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

// Vite falls back to the next free port (5174, 5175, ...) whenever 5173 is
// taken, so a single hardcoded CLIENT_ORIGIN silently breaks CORS the moment
// that happens (curl never catches this — CORS is browser-only). Accept any
// loopback origin instead; still strictly local-only, just not port-pinned.
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
// GitHub Pages is a supported deploy target for the frontend, so allow any
// *.github.io origin. When hosting the frontend elsewhere (Vercel/Netlify),
// set CLIENT_ORIGIN — it accepts a comma-separated list of exact origins.
const GITHUB_PAGES_ORIGIN = /^https:\/\/[a-z0-9-]+\.github\.io$/i;
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl, same-origin, server-to-server
  const clean = origin.replace(/\/$/, '');
  return (
    LOOPBACK_ORIGIN.test(clean) ||
    GITHUB_PAGES_ORIGIN.test(clean) ||
    ALLOWED_ORIGINS.includes(clean)
  );
}

app.use(cors({
  origin(origin, callback) {
    // Never throw here — a rejected preflight should be a normal 200 without
    // the Allow-Origin header (browser then blocks), not a 500.
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(passport.initialize());

app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/document-extractions', documentExtractionRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'farmtrust-server' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Bind to loopback only — this server is not meant to be reachable from
// the network, only from the frontend running on the same machine.
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`[farmtrust-server] listening on http://${HOST}:${PORT} (local only)`);
});
