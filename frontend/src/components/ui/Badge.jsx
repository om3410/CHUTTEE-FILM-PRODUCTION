const variants = {
  default: 'bg-zinc-800 text-zinc-300 ring-zinc-700',
  brand: 'bg-brand-500/15 text-brand-400 ring-brand-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  danger: 'bg-red-500/15 text-red-400 ring-red-500/30',
  red: 'bg-red-500/15 text-red-400 ring-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  warn: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  purple: 'bg-purple-500/15 text-purple-400 ring-purple-500/30',
};

export function Badge({ variant = 'default', icon: Icon, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset animate-fade-in ${variants[variant] || variants.default} ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

export default Badge;