import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

/* ─── Authentication Store ─── */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      access: null,
      refresh: null,
      isAuthenticated: false,
      loading: false,

      /* ─── Sign in (JWT) ─── */
      login: async (email, password) => {
        set({ loading: true });
        try {
          // FIX 1: backend JWT endpoint is /token/ and expects { username, password }
          const { data } = await api.post('/token/', {
            username: email,
            password,
          });

          // FIX 2: use 'chuttee-token' key (matches client.js ACCESS_KEY)
          if (data.access) localStorage.setItem('chuttee-token', data.access);
          if (data.refresh) localStorage.setItem('chuttee-refresh', data.refresh);

          // FIX 3: /token/ doesn't return user — fetch from /auth/api/me/
          let user = null;
          try {
            const meResp = await api.get('/auth/api/me/');
            user = meResp.data;
            localStorage.setItem('chuttee-user', JSON.stringify(user));
          } catch {
            user = { email };
          }

          set({
            user,
            company: null,
            access: data.access,
            refresh: data.refresh,
            isAuthenticated: true,
            loading: false,
          });

          return { ...data, user };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /* ─── Register ─── */
      register: async (payload) => {
        set({ loading: true });
        try {
          // FIX 4: register endpoint is /auth/api/register/
          const { data } = await api.post('/auth/api/register/', payload);

          if (data.access) localStorage.setItem('chuttee-token', data.access);
          if (data.refresh) localStorage.setItem('chuttee-refresh', data.refresh);

          // After register, fetch user
          let user = data.user || { email: payload.email, name: payload.name };
          try {
            const meResp = await api.get('/auth/api/me/');
            user = meResp.data;
            localStorage.setItem('chuttee-user', JSON.stringify(user));
          } catch {}

          set({
            user,
            company: data.company || null,
            access: data.access,
            refresh: data.refresh,
            isAuthenticated: !!data.access,
            loading: false,
          });

          return data;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /* ─── Manual auth setter ─── */
      setAuth: ({ user, company, access, refresh }) => {
        if (access) localStorage.setItem('chuttee-token', access);
        if (refresh) localStorage.setItem('chuttee-refresh', refresh);
        if (user) localStorage.setItem('chuttee-user', JSON.stringify(user));
        set({
          user,
          company: company || null,
          access,
          refresh: refresh || null,
          isAuthenticated: true,
        });
      },

      updateUser: (user) => {
        localStorage.setItem('chuttee-user', JSON.stringify(user));
        set({ user });
      },
      updateCompany: (company) => set({ company }),

      /* ─── Sign out ─── */
      logout: () => {
        localStorage.removeItem('chuttee-token');
        localStorage.removeItem('chuttee-refresh');
        localStorage.removeItem('chuttee-user');
        set({
          user: null,
          company: null,
          access: null,
          refresh: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'chuttee.auth' }
  )
);

/* ─── Theme Store ─── */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',

      setTheme: (value) => {
        if (!['dark', 'light', 'system'].includes(value)) return;
        const root = document.documentElement;
        const isDark =
          value === 'dark' ||
          (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);
        root.style.colorScheme = isDark ? 'dark' : 'light';
        set({ theme: value });
      },

      toggle: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      init: () => {
        const current = get().theme || 'dark';
        const root = document.documentElement;
        const isDark =
          current === 'dark' ||
          (current === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);
        root.style.colorScheme = isDark ? 'dark' : 'light';
      },
    }),
    { name: 'chuttee.theme' }
  )
);