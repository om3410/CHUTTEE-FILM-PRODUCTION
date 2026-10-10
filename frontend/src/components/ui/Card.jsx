export function Card({ className = "", children, ...props }) {
  return (
    <div className={`card animate-slide-up ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-zinc-800 p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div title={title} className="rounded-lg bg-zinc-800 p-2 text-brand-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
