import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('chuttee-token');
    const u = localStorage.getItem('chuttee-user');
    if (t && u) {
      try {
        const parsedUser = JSON.parse(u);
        setToken(t);
        setUser(parsedUser);
        useAuthStore.getState().login(t, parsedUser);
      } catch {
        localStorage.removeItem('chuttee-token');
        localStorage.removeItem('chuttee-user');
      }
    }
    setLoading(false);
  }, []);

  const login = (t, u) => {
    localStorage.setItem('chuttee-token', t);
    localStorage.setItem('chuttee-user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    useAuthStore.getState().login(t, u);
  };

  const logout = () => {
    localStorage.removeItem('chuttee-token');
    localStorage.removeItem('chuttee-user');
    setToken(null);
    setUser(null);
    useAuthStore.getState().logout();
  };

  const updateUser = (patch) => {
    const next = { ...user, ...patch };
    localStorage.setItem('chuttee-user', JSON.stringify(next));
    setUser(next);
    useAuthStore.getState().updateUser(patch);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};