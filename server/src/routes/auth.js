import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db, uuidv4 } from '../db.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/authenticate.js';

const router = Router();
const now = () => new Date().toISOString();

function publicUser(u) {
  if (!u) return null;
  const { password_hash, google_id, ...rest } = u;
  return { ...rest, verified_farmer: !!rest.verified_farmer };
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// No SMTP/email provider is wired into this local-only app — codes are
// always logged server-side. Gate the dev-mode "return the code in the API
// response" behavior on this flag (same opt-in pattern as GOOGLE_CLIENT_ID/
// STRIPE_SECRET_KEY) so a future real email integration can flip it off
// without touching every route. Frontend surfaces these dev_* fields
// directly in the UI so local dev/testing never requires reading server
// logs or querying the DB for a code.
const emailEnabled = !!process.env.SMTP_HOST;

// ---- Register: creates an unverified user + sends (logs) an OTP ----
router.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const code = genOtp();
  const payload = JSON.stringify({ password_hash: bcrypt.hashSync(password, 10) });
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO otp_codes (email, code, payload, expires_at) VALUES (?,?,?,?)
              ON CONFLICT(email) DO UPDATE SET code=excluded.code, payload=excluded.payload, expires_at=excluded.expires_at`)
    .run(email, code, payload, expires);

  // No email provider wired up — OTP is logged server-side for dev use.
  console.log(`[auth] OTP for ${email}: ${code}`);
  res.json({ success: true, ...(emailEnabled ? {} : { dev_otp: code }) });
});

router.post('/resend-otp', (req, res) => {
  const { email } = req.body || {};
  const row = db.prepare('SELECT * FROM otp_codes WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'No pending registration for this email' });
  const code = genOtp();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare('UPDATE otp_codes SET code=?, expires_at=? WHERE email=?').run(code, expires, email);
  console.log(`[auth] OTP resent for ${email}: ${code}`);
  res.json({ success: true, ...(emailEnabled ? {} : { dev_otp: code }) });
});

router.post('/verify-otp', (req, res) => {
  const { email, otpCode } = req.body || {};
  const row = db.prepare('SELECT * FROM otp_codes WHERE email = ?').get(email);
  if (!row) return res.status(400).json({ error: 'No pending registration for this email' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired, request a new one' });
  if (row.code !== otpCode) return res.status(400).json({ error: 'Invalid verification code' });

  const { password_hash } = JSON.parse(row.payload);
  const id = uuidv4();
  const ts = now();
  db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, account_type, email_verified, created_date, updated_date)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, email, password_hash, email.split('@')[0], 'user', 'customer', 1, ts, ts);
  db.prepare('DELETE FROM otp_codes WHERE email = ?').run(email);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ access_token: signToken(user), user: publicUser(user) });
});

// ---- Login ----
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ access_token: signToken(user), user: publicUser(user) });
});

// ---- Password reset (token logged server-side, dev-mode) ----
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always respond success regardless, matching original behavior (no user enumeration).
  // dev_reset_token is the one deliberate exception: it's only ever present
  // when emailEnabled is false, i.e. a local machine with no real mail
  // provider, where "does this email exist" isn't a meaningful secret to
  // begin with. Never do this once a real email provider is configured.
  let dev_reset_token;
  if (user) {
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO password_resets (token, email, expires_at) VALUES (?,?,?)').run(token, email, expires);
    console.log(`[auth] Password reset link for ${email}: /reset-password?token=${token}`);
    if (!emailEnabled) dev_reset_token = token;
  }
  res.json({ success: true, ...(dev_reset_token ? { dev_reset_token } : {}) });
});

router.post('/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body || {};
  const row = db.prepare('SELECT * FROM password_resets WHERE token = ?').get(resetToken);
  if (!row || new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired reset link' });
  db.prepare('UPDATE users SET password_hash=?, updated_date=? WHERE email=?')
    .run(bcrypt.hashSync(newPassword, 10), now(), row.email);
  db.prepare('DELETE FROM password_resets WHERE token = ?').run(resetToken);
  res.json({ success: true });
});

// ---- Me ----
router.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

router.patch('/me', requireAuth, (req, res) => {
  const allowed = ['full_name', 'phone', 'village', 'district', 'state', 'country',
    'preferred_language', 'date_of_birth', 'bio', 'farming_since', 'avatar_url', 'account_type'];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
  if (sets.length) {
    sets.push('updated_date = ?'); vals.push(now()); vals.push(req.user.id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  }
  res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
});

// ---- Google OAuth ----
const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Public config the frontend checks before showing "Continue with Google" —
// without it, clicking the button full-page-navigates to a raw JSON 501.
router.get('/config', (_req, res) => res.json({ googleEnabled }));

if (googleEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('Google account has no email'));
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const id = uuidv4(); const ts = now();
      db.prepare(`INSERT INTO users (id, email, google_id, full_name, role, account_type, email_verified, created_date, updated_date)
                  VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(id, email, profile.id, profile.displayName || email.split('@')[0], 'user', 'customer', 1, ts, ts);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else if (!user.google_id) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(profile.id, user.id);
    }
    done(null, user);
  }));

  router.get('/google', (req, res, next) => {
    const returnTo = req.query.returnTo || '/';
    passport.authenticate('google', { scope: ['profile', 'email'], state: encodeURIComponent(returnTo), session: false })(req, res, next);
  });

  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      if (err || !user) return res.redirect(`${clientOrigin}/login?error=google_auth_failed`);
      const token = signToken(user);
      const returnTo = decodeURIComponent(req.query.state || '/');
      // app-params.js already reads access_token off the URL and persists it.
      res.redirect(`${clientOrigin}${returnTo}${returnTo.includes('?') ? '&' : '?'}access_token=${token}`);
    })(req, res, next);
  });
} else {
  router.get('/google', (_req, res) => res.status(501).json({ error: 'Google OAuth not configured on this server' }));
}

export default router;
