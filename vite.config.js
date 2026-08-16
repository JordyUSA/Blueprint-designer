import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages serves a project site from a sub-path
 * (https://<user>.github.io/Blueprint-designer/), so the production build needs
 * a matching `base` or every asset URL 404s. The deploy workflow passes the real
 * path in as VITE_BASE — derived from the repository itself, so renaming the repo
 * does not break the build — and the literal below is the fallback for local
 * `npm run build`. The dev server always serves from the root.
 */
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE || (command === 'build' ? '/Blueprint-designer/' : '/'),
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
}));
