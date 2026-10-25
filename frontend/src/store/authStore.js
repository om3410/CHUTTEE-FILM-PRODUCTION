import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

const DEVICE_KEY = 'chuttee_device_id';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function getDeviceName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      access: null,
      refresh: null,
      sessionId: null,
      isAuthenticated: false,
      loading: false,

      login: async (username, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/login/', {
            username,
            password,
            device_id: getDeviceId(),
            device_name: getDeviceName(),
          });

          if (data.access) localStorage.setItem('chuttee-token', data.access);
          if (data.refresh) localStorage.setItem('chuttee-refresh', data.refresh);
          if (data.session_id) localStorage.setItem('chuttee-session-id', data.session_id);

          let user = null;
          try {
            const meResp = await api.get('/me/');
            user = meResp.data;
            localStorage.setItem('chuttee-user', JSON.stringify(user));
          } catch {
            user = { username };
          }

          if (data.risk_level === 'high') {
            console.warn('Suspicious login:', data.risk_reasons);
          }

          set({
            user,
            company: null,
            access: data.access,
            refresh: data.refresh,
            sessionId: data.session_id || null,
            isAuthenticated: true,
            loading: false,
          });

          return { ...data, user };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      register: async (payload) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/register-api/', payload);

          const loginResp = await api.post('/login/', {
            username: payload.username,
            password: payload.password,
            device_id: getDeviceId(),
            device_name: getDeviceName(),
          });
          const tokens = loginResp.data;

          if (tokens.access) localStorage.setItem('chuttee-token', tokens.access);
          if (tokens.refresh) localStorage.setItem('chuttee-refresh', tokens.refresh);
          if (tokens.session_id) localStorage.setItem('chuttee-session-id', tokens.session_id);

          let user = { username: payload.username, email: payload.email };
          try {
            const meResp = await api.get('/me/');
            user = meResp.data;
            localStorage.setItem('chuttee-user', JSON.stringify(user));
          } catch {}

          set({
            user,
            company: null,
            access: tokens.access,
            refresh: tokens.refresh,
            sessionId: tokens.session_id || null,
            isAuthenticated: true,
            loading: false,
          });

          return { ...data, user, access: tokens.access, refresh: tokens.refresh };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      setAuth: ({ user, company, access, refresh, sessionId }) => {
        if (access) localStorage.setItem('chuttee-token', access);
        if (refresh) localStorage.setItem('chuttee-refresh', refresh);
        if (sessionId) localStorage.setItem('chuttee-session-id', sessionId);
        if (user) localStorage.setItem('chuttee-user', JSON.stringify(user));
        set({
          user,
          company: company || null,
          access,
          refresh: refresh || null,
          sessionId: sessionId || null,
          isAuthenticated: true,
        });
      },

      updateUser: (user) => {
        localStorage.setItem('chuttee-user', JSON.stringify(user));
        set({ user });
      },
      updateCompany: (company) => set({ company }),

      logout: async () => {
        const refresh = localStorage.getItem('chuttee-refresh');
        try {
          if (refresh) await api.post('/logout/', { refresh });
        } catch {}
        localStorage.removeItem('chuttee-token');
        localStorage.removeItem('chuttee-refresh');
        localStorage.removeItem('chuttee-user');
        localStorage.removeItem('chuttee-session-id');
        set({
          user: null,
          company: null,
          access: null,
          refresh: null,
          sessionId: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'chuttee.auth' }
  )
);

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
        get().setTheme(current === 'dark' ? 'light' : 'dark');
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