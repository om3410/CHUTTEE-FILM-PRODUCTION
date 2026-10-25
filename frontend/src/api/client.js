import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const ACCESS_KEY = 'chuttee-token';
const REFRESH_KEY = 'chuttee-refresh';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem(ACCESS_KEY);
  if (t) {
    c.headers = c.headers || {};
    c.headers.Authorization = `Bearer ${t}`;
  }
  return c;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const res = err.response;
    const code = res?.data?.code;
    const orig = err.config || {};

    if (res?.status === 401 && (code === 'token_revoked' || code === 'session_revoked')) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('chuttee-user');
      localStorage.removeItem('chuttee-session-id');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (res?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!refresh) {
        localStorage.removeItem(ACCESS_KEY);
        window.location.href = '/login';
        return Promise.reject(err);
      }
      try {
        const r = await axios.post(`${API_URL}/refresh/`, { refresh });
        const { access, refresh: newRefresh } = r.data;
        localStorage.setItem(ACCESS_KEY, access);
        if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
        orig.headers = orig.headers || {};
        orig.headers.Authorization = `Bearer ${access}`;
        return api.request(orig);
      } catch {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem('chuttee-user');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
