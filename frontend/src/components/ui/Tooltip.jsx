import { useState } from 'react';

export default function Tooltip({ label, children, side = 'top' }) {
  const [show, setShow] = useState(false);
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className={`pointer-events-none absolute z-40 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 shadow-lg animate-fade-in ${positions[side]}`}>{label}</span>
      )}
    </span>
  );
}