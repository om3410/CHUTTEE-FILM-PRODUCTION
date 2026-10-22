import { cn } from '../../lib/utils';

export default function Input({ label, icon: Icon, error, className, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />}
        <input
          {...props}
          className={cn(
            'w-full rounded-premium border bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/20',
            Icon && 'pl-10',
            error ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-700 focus:border-gold-500',
            className
          )}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
