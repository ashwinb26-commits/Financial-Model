import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Absolute base path.
 *
 * The starter used './' so it could sit under a GitHub Pages project URL. This
 * app has client-side routes (/login, /admin, /admin/historical), and relative
 * asset paths resolve differently depending on how deep the current URL is, so
 * nested routes would request assets from the wrong place. Cloudflare Pages
 * serves from the domain root, where '/' is correct.
 */
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // One vendor chunk for React keeps the admin and public bundles small
    // enough that a first visit to the dashboard does not download the editor.
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/react') ? 'react' : undefined),
      },
    },
  },
});
