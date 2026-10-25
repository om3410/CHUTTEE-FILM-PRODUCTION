import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy ONLY trailing-slash paths to the backend (these are API endpoints)
      '^/login/$':           BACKEND,
      '^/refresh/$':         BACKEND,
      '^/verify/$':          BACKEND,
      '^/logout/$':          BACKEND,
      '^/logout-all/$':      BACKEND,
      '^/sessions(/.*)?$':   BACKEND,
      '^/me(/.*)?$':         BACKEND,
      '^/register-api/$':    BACKEND,
      '^/account-recovery/$':BACKEND,
      '^/password-reset/':   BACKEND,
      '^/session-login/$':   BACKEND,
      '^/session-logout/$':  BACKEND,
      '^/api/':              BACKEND,
    },
  },
});
