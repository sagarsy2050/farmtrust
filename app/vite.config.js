import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The original platform's Vite plugin was removed entirely — it was the
// source of analyticsTracker / navigationNotifier / hmrNotifier calls out
// to a third-party platform. This app now only talks to your own server on
// 127.0.0.1.
//
// The removed plugin was also what resolved the "@/..." import alias used
// throughout src/ — jsconfig.json's `paths` only helps editor intellisense,
// it does nothing for Vite's own module resolution — so that alias has to be
// declared explicitly here now.
// `base` controls the public path assets are served from. Local dev and any
// root-domain host (Vercel/Netlify) use '/'. GitHub Pages serves this project
// at https://<user>.github.io/farmtrust/, so the Pages build sets
// VITE_BASE=/farmtrust/ (see .github/workflows/pages.yml).
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1', // dev server itself stays loopback-only too
  },
});
