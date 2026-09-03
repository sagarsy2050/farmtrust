# Deploying FarmTrust as a shareable live demo

Goal: one public URL you can put on a resume / send to anyone, while the source
repo stays private. The app has two parts that deploy separately:

| Part | Folder | Host | Config file |
|---|---|---|---|
| Frontend (React/Vite static site) | `app/` | Vercel or Netlify | `app/vercel.json`, `app/netlify.toml` |
| Backend (Node/Express + SQLite API) | `server/` | Render (or Railway/Fly) | `server/render.yaml` |

The backend re-creates and re-seeds its SQLite database from `server/src/db.js`
on every boot, so the marketplace always comes up populated. OCR and the
AI-image detector are turned **off** for the demo (they need a heavy Python
runtime); everything else works — browsing, search, email login via on-screen
dev codes, cart, checkout (auto-marks orders paid with no Stripe call).

---

## Step 1 — Deploy the backend (Render, free)

1. Go to <https://render.com>, sign up (GitHub login is easiest), authorize it
   to read the private `sagarsy2050/farmtrust` repo.
2. **New +** -> **Blueprint** -> select the repo. Render detects
   `server/render.yaml`.
3. It will prompt for one value it can't generate:
   - `CLIENT_ORIGIN` — leave it as a placeholder for now (e.g.
     `https://example.com`); you'll set the real frontend URL in Step 3.
   `JWT_SECRET` and `SESSION_SECRET` are auto-generated; `HOST`, `PORT`,
   `OCR_ENABLED=false`, etc. come from the blueprint.
4. **Apply** / **Create**. First build takes ~3–5 min.
5. When it's live, copy the URL, e.g. `https://farmtrust-api.onrender.com`.
   Check `https://farmtrust-api.onrender.com/api/health` returns
   `{"ok":true,"service":"farmtrust-server"}`.

> Free tier: the service sleeps after ~15 min idle, so the first request after
> a pause takes ~40s to wake. Fine for a portfolio demo.

## Step 2 — Deploy the frontend (Vercel, free)

1. Go to <https://vercel.com>, sign up with GitHub, import
   `sagarsy2050/farmtrust`.
2. **Root Directory** = `app`. Vercel reads `app/vercel.json` for build command,
   output dir, and the SPA rewrite — leave those as detected.
3. **Environment Variables**:
   - `VITE_API_BASE` = `https://farmtrust-api.onrender.com/api`
     (your Step 1 URL + `/api`)
4. **Deploy**. You get `https://farmtrust-<something>.vercel.app` — rename it to
   `farmtrust` in project settings if free.
   **This is the link you share.**

## Step 3 — Connect the two

1. Back on Render -> the `farmtrust-api` service -> **Environment** ->
   set `CLIENT_ORIGIN` = your Vercel URL (`https://farmtrust.vercel.app`, no
   trailing slash). Save — it redeploys.
2. If you change `VITE_API_BASE` later, redeploy the Vercel project (the value
   is baked in at build time).
3. Open the Vercel URL, hard-refresh. The marketplace should load real data from
   the backend. A `401 /api/auth/me` in the console is normal (not logged in).

---

## Netlify instead of Vercel

`app/netlify.toml` is already set up. **Add new site -> Import** -> pick the
repo -> **Base directory** = `app` -> add env var `VITE_API_BASE` -> deploy.

## Railway / Fly instead of Render

Both run the `server/` folder as a Node service. Use the same env vars as
`server/.env.production.example`. Set `HOST=0.0.0.0`; the platform provides
`PORT`. `better-sqlite3` is a native module — Railway and Fly build it fine on
their default Node images.

## Instant temporary link (no accounts, while your PC is on)

Not for a resume, but useful to show someone right now:

```bash
# terminal 1 — backend
cd server && npm start
# terminal 2 — frontend built + served
cd app && npm run build && npm run preview
# terminal 3 — expose the frontend (installs on first run)
npx localtunnel --port 4173
```

`localtunnel` prints a public `https://*.loca.lt` URL. It dies when you close the
terminal or your machine sleeps. You'd also need to point the build's
`VITE_API_BASE` at a tunnel for the backend, so the full-deploy path above is
simpler for anything lasting.

---

## Security notes

- Only the built JS in `app/dist/` reaches visitors. Keep every secret in the
  backend host's env-var store; the frontend holds only the public API URL.
- `server/.env` is gitignored and never leaves your machine.
  `server/.env.production.example` is a blank template — safe to commit, never
  fill it in and commit that.
- The repo is private. A recruiter clicking the live link needs no repo access.
  If you also want the code visible, either flip the repo public
  (`gh repo edit sagarsy2050/farmtrust --visibility public`) or keep it private
  and add screenshots + the live link to your resume.

## Resume line

> **FarmTrust** — verified-farmer produce marketplace. React, Node/Express,
> SQLite, Python OCR pipeline. Live demo: `farmtrust.vercel.app`
