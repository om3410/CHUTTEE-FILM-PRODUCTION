import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as auditLog from '../security/auditLog';
import * as threatDetection from '../security/threatDetection';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [threat, setThreat] = useState(null);

  const refresh = useCallback(() => {
    setEvents(auditLog.getAll());
    setThreat(threatDetection.analyze());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('chuttee:audit', handler);
    return () => window.removeEventListener('chuttee:audit', handler);
  }, [refresh]);

  return (
    <SecurityContext.Provider value={{ events, threat, refresh }}>
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
};