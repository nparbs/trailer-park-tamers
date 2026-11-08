import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
  test: { environment: 'node' },
} as any);
