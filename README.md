# FarmTrust — Base44 → Node.js + Python migration (local-only)

**Runs entirely on your machine.** The server binds to `127.0.0.1` only
(never the LAN), the DB is a local SQLite file, uploads sit on local disk,
OCR runs via a local Python subprocess, and checkout works completely
offline by default (orders are auto-marked "paid" locally with zero network
calls — see "Payments" below). The only things that reach the internet are
things you explicitly opt into by adding keys: Google OAuth and real Stripe.
The Base44 Vite plugin (which phoned home for analytics/HMR/navigation
tracking) has been removed from `vite.config.js` entirely.

Quickest start: `./start-local.sh /path/to/your/app` after applying the
frontend patch below — boots the backend and your Vite dev server together.


This replaces the Base44 platform (entities, auth, functions, file storage) with:

- **`server/`** — Express + better-sqlite3 backend. Re-implements every entity
  (`Farm`, `Product`, `Order`, `Document`, `Review`, `User`, `VerificationCheck`)
  with the *same* read/create/update/delete permission rules that were in each
  `.jsonc`'s `rls` block, plus JWT + bcrypt auth, Google OAuth, and the three
  Stripe functions (`createCheckoutSession`, `verifyPayment`, `updateOrderStatus`).
- **`python-ocr/`** — `uv`-managed Python worker (PyMuPDF + OpenCV + pytesseract)
  that OCRs uploaded land documents and pulls out survey number / area / village
  / name candidates via regex. Invoked as a subprocess from the upload route,
  same pattern as your CommerceFlow OCR pipeline. JSON-only on stdout.
- **`frontend-patch/`** — two files that replace their counterparts in your
  existing `src/`. Every page (`ProductsManager.jsx`, `AdminFarmers.jsx`, etc.)
  keeps calling `base44.entities.Product.filter(...)`, `base44.auth.me()`,
  `base44.functions.invoke(...)` exactly as before — only what's *behind*
  `base44Client.js` changed.

## What did NOT change

All 35+ page/component files under `src/pages` and `src/components` are
untouched. `src/lib/app-params.js` is untouched — it already reads
`?access_token=` off the URL and persists it to `localStorage`, which is
exactly how the new server hands back a token after Google OAuth or a fresh
login. `src/lib/cartContext.jsx`, `src/lib/format.js`, UI components — all
untouched.

`src/pages/OAuthConsent.jsx` is Base44-platform-specific (MCP OAuth consent
for the Base44 hosting platform itself) and isn't routed anywhere in
`App.jsx`. It's dead code either way — delete it if you want, or leave it.

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env        # fill in JWT_SECRET, STRIPE_SECRET_KEY, etc.
npm install
npm run dev                  # http://localhost:3001
```

On first boot it creates `farmtrust.db` (SQLite) and bootstraps an admin
account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

### 2. Python OCR worker

```bash
cd python-ocr
uv sync
```

Also needs the Tesseract binary on PATH (`apt install tesseract-ocr` /
`brew install tesseract`). Set `OCR_ENABLED=false` in `server/.env` if you
don't want OCR wired up yet — uploads still work, just without extraction.

### 3. Apply the frontend patch

```bash
cp frontend-patch/src/api/base44Client.js  <your-app>/src/api/base44Client.js
cp frontend-patch/src/lib/AuthContext.jsx  <your-app>/src/lib/AuthContext.jsx
```

Add to `<your-app>/.env.local`:

```
VITE_API_BASE=http://localhost:3001/api
```

Remove `@base44/sdk` and `@base44/vite-plugin` from `package.json` /
`vite.config.js` once you've confirmed the patch works — they're inert now
(nothing imports `@base44/sdk` anymore) but no longer needed. `npm install`
after removing them.

### 4. Run the frontend

```bash
npm run dev    # normal Vite dev server, now pointed at your own backend
```

## Auth flows implemented

- **Email/password**: `Register.jsx`'s OTP screen is fully wired — register
  sends a 6-digit code (logged to the server console since no email provider
  is configured; wire one into `routes/auth.js` `console.log` spots when
  ready), `verify-otp` creates the account and returns a JWT.
- **Google OAuth**: set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` /
  `GOOGLE_CALLBACK_URL` in `server/.env`. `Login.jsx`'s "Continue with Google"
  button already calls `base44.auth.loginWithProvider('google', returnTo)`,
  which now redirects through your server's passport-google-oauth20 flow and
  back to the app with `?access_token=...` — `app-params.js` picks it up
  automatically.
- **Password reset**: `forgot-password` / `reset-password` implemented,
  reset link logged server-side (dev mode) same as OTP.

## Permission model

Base44's `rls` blocks are re-implemented as plain JS predicates in
`server/src/routes/entities.js` (`RULES` object) — one `read`/`create`/
`update`/`delete` function per table, evaluated against the requesting user.
`asServiceRole` calls from the admin pages map to an `X-Service-Role: true`
header that the server only honors when the caller's JWT role is `admin`.

## Payments

By default `STRIPE_SECRET_KEY` is blank in `.env.example`, which puts
`createCheckoutSession` in **offline mock mode**: it marks the order
`paid` + `accepted` immediately, no network call, and hands back a
`local_<uuid>` session id that `verifyPayment` recognizes and resolves
locally. Checkout, `OrderSuccess.jsx`, farmer order management — all work
end-to-end with zero internet access.

Set a real `sk_test_...`/`sk_live_...` key if you want actual Stripe
involved; the original checkout-session/verify flow (unchanged logic) takes
over automatically. Webhook verification wasn't in the original functions
either (they poll `verifyPayment` on the success page) — add a
`/api/functions/stripeWebhook` route later if you want push-based
confirmation instead.

## Frontend build changes

`frontend-patch/vite.config.js` replaces yours — it drops
`@base44/vite-plugin` (analytics/nav/HMR tracking that called out to
Base44's platform) and pins the dev server to `127.0.0.1`. Copy it over
the same way as the other two patch files, then remove `@base44/sdk` and
`@base44/vite-plugin` from `package.json` and `npm install`.
