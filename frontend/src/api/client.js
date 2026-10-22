import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ACCESS_KEY = 'chuttee-token';

function getCookie(name) {
  if (!document.cookie) return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive csrftoken + session cookies cross-origin
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem(ACCESS_KEY);
  if (t) c.headers.Authorization = `Bearer ${t}`;

  // Attach CSRF token for unsafe methods
  const method = (c.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) c.headers['X-CSRFToken'] = csrftoken;
  }
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
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export default api;