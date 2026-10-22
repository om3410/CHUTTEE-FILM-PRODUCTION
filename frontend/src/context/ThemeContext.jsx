import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const VALID_THEMES = ['dark', 'light', 'system'];

/* Resolve the effective theme (handles 'system' by checking OS preference) */
const resolveEffective = (theme) => {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return theme === 'light' ? 'light' : 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('chuttee.theme');
      return VALID_THEMES.includes(saved) ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  /* Apply the theme to <html> whenever it changes, or when OS changes if 'system' */
  useEffect(() => {
    const apply = () => {
      const effective = resolveEffective(theme);
      const root = document.documentElement;

      root.classList.toggle('dark', effective === 'dark');
      root.classList.toggle('light', effective === 'light');
      root.style.colorScheme = effective;

      try { localStorage.setItem('chuttee.theme', theme); } catch {}
    };

    apply();

    /* When on 'system', listen for OS theme changes */
    if (theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else mq.addListener(handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler);
        else mq.removeListener(handler);
      };
    }
  }, [theme]);

  /* Safe setter — only accepts valid values */
  const setTheme = (value) => {
    if (VALID_THEMES.includes(value)) setThemeState(value);
  };

  /* Backward-compatible toggle (still used by Navbar) */
  const toggleTheme = () => {
    setThemeState((t) => {
      const effective = resolveEffective(t);
      return effective === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};