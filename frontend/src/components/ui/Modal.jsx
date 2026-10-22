import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { cn } from '../../lib/utils';

export default function Modal({ open, onClose, title, icon: Icon, size = 'md', children }) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-premium border border-zinc-800 bg-zinc-900 shadow-2xl', sizes[size])}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-8 w-8 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <h2 className="font-serif text-lg font-bold text-zinc-100">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Close">
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
