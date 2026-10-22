import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  brand:   'bg-gold-500/15 text-gold-400 border-gold-500/40',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  warn:    'bg-amber-500/15 text-amber-300 border-amber-500/40',
  danger:  'bg-red-500/15 text-red-300 border-red-500/40',
  info:    'bg-blue-500/15 text-blue-300 border-blue-500/40',
};

export default function Badge({ variant = 'default', icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)}>
      {Icon && <Icon className="h-2.5 w-2.5" />}
      {children}
    </span>
  );
}
