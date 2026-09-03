# Deploying the FarmTrust frontend (static demo)

This deploys **only the React frontend** (`app/`) as a static site. The source
repo stays private; visitors only get the built JavaScript bundle and the URL.

> The frontend on its own has no data. Every page calls a backend API
> (`VITE_API_BASE`). Until you deploy `server/` somewhere reachable, the site
> loads but the marketplace, auth, etc. return network errors. See
> "Pointing at a backend" below.

## Option A — Vercel

1. Push this repo to GitHub (already done: `sagarsy2050/farmtrust`, private).
2. In Vercel: **Add New Project** -> import the repo.
3. Set **Root Directory** = `app`. Vercel reads `app/vercel.json` for the rest
   (build command, output dir, SPA rewrite).
4. Add an environment variable:
   - `VITE_API_BASE` = `https://<your-backend-host>/api`
     (leave unset for now if you have no backend yet)
5. Deploy. You get a `*.vercel.app` URL to share.

## Option B — Netlify

1. **Add new site -> Import an existing project** -> pick the repo.
2. Set **Base directory** = `app`. `app/netlify.toml` supplies build command,
   publish dir, and the SPA redirect.
3. **Site settings -> Environment variables**:
   - `VITE_API_BASE` = `https://<your-backend-host>/api`
4. Deploy -> `*.netlify.app` URL.

## Pointing at a backend

`VITE_API_BASE` is baked into the bundle **at build time**, so after you change
it you must trigger a fresh deploy/build. It is not a secret — it only holds the
public URL of your API.

When you deploy `server/`, also set on the backend:
- `CLIENT_ORIGIN` = the deployed frontend URL (for CORS)
- real `JWT_SECRET` / `SESSION_SECRET` values (host env vars, never committed)

## Local build check

```bash
cd app
npm ci
npm run build      # outputs to app/dist/
npm run preview     # serves the built site at http://localhost:4173
```

## Security notes

- Anything in `app/dist/` is fully readable by any visitor. Keep all secrets on
  the backend; the frontend should only ever hold the public API URL.
- `server/.env` is gitignored and never leaves your machine. Keep it that way.
- The repo is private on GitHub — do not add collaborators you don't intend to
  give full source access.
