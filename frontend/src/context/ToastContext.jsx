import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiX, FiInfo } from 'react-icons/fi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const iconMap = { success: FiCheckCircle, error: FiAlertTriangle, info: FiInfo };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = iconMap[t.type] || FiInfo;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur ${
                  t.type === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : t.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-zinc-700 bg-zinc-900/90 text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{t.message}</span>
                <button onClick={() => dismiss(t.id)} className="ml-2 text-zinc-400 hover:text-zinc-100">
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};