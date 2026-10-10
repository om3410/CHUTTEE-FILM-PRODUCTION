import { FiRefreshCw } from 'react-icons/fi';

export default function Loader({ label = 'Loading…', size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 animate-fade-in">
      <FiRefreshCw className={`${sizes[size]} animate-spin text-brand-500`} />
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}