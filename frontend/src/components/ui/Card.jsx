import { cn } from '../../lib/utils';

export default function Card({ children, className, ...props }) {
  return (
    <div className={cn('premium-card', className)} {...props}>
      {children}
    </div>
  );
}

// Named export so `import { Card } from '../ui/Card'` also works
export { Card };

export function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h3 className="font-serif text-lg font-semibold text-zinc-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
