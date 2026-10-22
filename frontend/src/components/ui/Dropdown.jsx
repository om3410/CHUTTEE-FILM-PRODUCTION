import { useState, useRef, useEffect } from 'react';

export default function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-premium border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, onClick, className }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${className || ''}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
