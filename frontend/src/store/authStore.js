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

      /* ─── Sign in ─── */
      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/login/', { email, password });

          if (data.access) localStorage.setItem('chuttee.access', data.access);
          if (data.refresh) localStorage.setItem('chuttee.refresh', data.refresh);

          set({
            user: data.user || { email },
            company: data.company || null,
            access: data.access,
            refresh: data.refresh,
            isAuthenticated: true,
            loading: false,
          });

          return data;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /* ─── Register ─── */
      register: async (payload) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/register/', payload);

          if (data.access) localStorage.setItem('chuttee.access', data.access);
          if (data.refresh) localStorage.setItem('chuttee.refresh', data.refresh);

          set({
            user: data.user || { email: payload.email, name: payload.name },
            company: data.company || null,
            access: data.access,
            refresh: data.refresh,
            isAuthenticated: true,
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
        if (access) localStorage.setItem('chuttee.access', access);
        if (refresh) localStorage.setItem('chuttee.refresh', refresh);
        set({
          user,
          company: company || null,
          access,
          refresh: refresh || null,
          isAuthenticated: true,
        });
      },

      updateUser: (user) => set({ user }),
      updateCompany: (company) => set({ company }),

      /* ─── Sign out ─── */
      logout: () => {
        localStorage.removeItem('chuttee.access');
        localStorage.removeItem('chuttee.refresh');
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