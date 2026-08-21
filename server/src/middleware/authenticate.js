import { verifyToken } from '../utils/jwt.js';
import { db } from '../db.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.query.access_token) return req.query.access_token;
  return null;
}

// Attaches req.user if a valid token is present; never blocks the request.
export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
      if (user) req.user = user;
    }
  }
  next();
}

// Requires a valid token; 401s otherwise.
export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}
