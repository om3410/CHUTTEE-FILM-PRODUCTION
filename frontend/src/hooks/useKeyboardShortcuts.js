import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts(handlers = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers['cmd+k']?.();
      }
      if (e.key === 'g') {
        const next = (ev) => {
          const map = { d: '/', c: '/crew', s: '/scenes', b: '/budget', i: '/inbox', a: '/ai' };
          const to = map[ev.key.toLowerCase()];
          if (to) navigate(to);
          document.removeEventListener('keydown', next);
        };
        document.addEventListener('keydown', next, { once: true });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handlers, navigate]);
}