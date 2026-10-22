import { cn } from '../../lib/utils';

export default function Avatar({ name = '?', src, size = 'md', ring = false }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  };
  const fallback = src || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=141414`;
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-full bg-gold-500/10 grid place-items-center font-serif font-bold text-gold-400', ring && 'ring-2 ring-gold-500/40', sizes[size])}>
      <img src={fallback} alt={name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
    </div>
  );
}
