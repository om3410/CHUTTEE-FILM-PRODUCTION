import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy ALL /api requests to Django (crew, cast, scenes, etc.)
      '/api': {
        target: BACKEND,
        changeOrigin: true,
      },
      // JWT / auth endpoints served at root (not under /api)
      '^/login/$':            BACKEND,
      '^/refresh/$':          BACKEND,
      '^/verify/$':           BACKEND,
      '^/logout/$':           BACKEND,
      '^/logout-all/$':       BACKEND,
      '^/sessions(/.*)?$':    BACKEND,
      '^/me(/.*)?$':          BACKEND,
      '^/register-api/$':     BACKEND,
      '^/account-recovery/$': BACKEND,
      '^/password-reset/':    BACKEND,
      '^/session-login/$':    BACKEND,
      '^/session-logout/$':   BACKEND,
    },
  },
});
