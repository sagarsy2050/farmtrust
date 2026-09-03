# Frontend deploy

The frontend deploy steps moved to the repo-root **[`DEPLOY.md`](../DEPLOY.md)**,
which now covers the full stack (frontend + backend + how to connect them).

Config files in this folder:

- `vercel.json` — Vercel build settings + SPA rewrite (BrowserRouter needs the
  `index.html` fallback)
- `netlify.toml` — the Netlify equivalent

Env var this app reads at **build time**:

- `VITE_API_BASE` — full URL of the backend API, e.g.
  `https://farmtrust-api.onrender.com/api`. Falls back to
  `http://localhost:3001/api` when unset.

Local build check:

```bash
cd app
npm ci
npm run build     # -> app/dist/
npm run preview   # serves the built site at http://localhost:4173
```
