import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Base44 plugin removed entirely — it was the source of analyticsTracker /
// navigationNotifier / hmrNotifier calls out to Base44's platform. This app
// now only talks to your own server on 127.0.0.1.
//
// The removed plugin was also what resolved the "@/..." import alias used
// throughout src/ — jsconfig.json's `paths` only helps editor intellisense,
// it does nothing for Vite's own module resolution — so that alias has to be
// declared explicitly here now.
export default defineConfig({
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
