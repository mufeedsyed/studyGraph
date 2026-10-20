import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/studyGraph/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://studygraph-cfh8.onrender.com/',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://studygraph-cfh8.onrender.com/',
        changeOrigin: true,
      }
    }
  }
});
