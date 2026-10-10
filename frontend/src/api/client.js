import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/token/');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('chuttee-token');
      localStorage.removeItem('chuttee-user');
      useAuthStore.getState().logout();
      sessionStorage.setItem('chuttee-auth-message', 'Your session expired. Please sign in again.');
      if (!window.location.pathname.includes('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default client;