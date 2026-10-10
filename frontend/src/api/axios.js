import axios from "axios";
import {MOCK} from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {'Content-Type': 'application/json'},
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chuttee-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chuttee-token');
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

if (USE_MOCK) {
  api.get = async (path) => {
    await delay();
    const clean = path.replace(/^\/+|\/+$/g, '').split('?')[0];
    const [resource, id] = clean.split('/');
    const collection = MOCK[resource];
    if (!collection) return { data: {} };
    if (id && Array.isArray(collection)) {
      const found = collection.find((x) => x.id === id);
      return { data: found || { results: collection } };
    }
    return { data: { results: collection, count: collection?.length ?? 0 } };
  };
  api.post = async () => { await delay(); return { data: { ok: true } }; };
  api.patch = async () => { await delay(); return { data: { ok: true } }; };
  api.delete = async () => { await delay(); return { data: { ok: true } }; };
}

export default api;