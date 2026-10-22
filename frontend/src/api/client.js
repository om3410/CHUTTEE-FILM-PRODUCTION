import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ACCESS_KEY = 'chuttee-token';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem(ACCESS_KEY);
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const orig = e.config;
    if (e.response?.status === 401 && !orig?._retry) {
      orig._retry = true;
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem('chuttee-user');
      window.location.href = '/signin';
    }
    return Promise.reject(e);
  }
);

export default api;