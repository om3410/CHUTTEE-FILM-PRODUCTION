import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts(handlers = {}) {
  const navigate = useNavigate();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const onKey = (e) => {
      // Ignore shortcuts when typing in inputs/textareas
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlersRef.current['cmd+k']?.();
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
  }, [navigate]);
}