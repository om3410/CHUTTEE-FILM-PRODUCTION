import { cn } from '../../lib/utils';

export default function Button({ children, variant = 'primary', size = 'md', icon: Icon, loading = false, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-premium font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: 'bg-gradient-to-br from-gold-300 to-gold-600 text-zinc-950 shadow-gold hover:shadow-glow hover:scale-[1.02] active:scale-[0.99]',
    outline: 'border border-[var(--gold)]/40 bg-[var(--gold-soft)] text-[var(--gold)] hover:border-[var(--gold)] hover:shadow-gold',
    ghost: 'text-zinc-400 hover:text-gold-400 hover:bg-zinc-800',
    destructive: 'bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} disabled={loading} {...props}>
      {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {Icon && !loading && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
