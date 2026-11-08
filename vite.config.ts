import { defineConfig } from 'vite';

// In development, run `npm run server` alongside `npm run dev`; the page talks to it through /ws.
export default defineConfig({
  base: './',
  server: {
    host: true,
    proxy: { '/ws': { target: 'ws://localhost:8790', ws: true } },
  },
  build: { chunkSizeWarningLimit: 2000 },
  test: { environment: 'node' },
} as any);
