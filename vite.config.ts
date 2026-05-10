import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://16.171.208.156:8000',
        changeOrigin: true,
        xfwd: true,
      },
      '/media': {
        target: 'http://16.171.208.156:8000',
        changeOrigin: true,
        xfwd: true,
      },
    },
  },
});
