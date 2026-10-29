import { FiUsers, FiArrowRight } from 'react-icons/fi';

export function StatNumber({ value, label, note }) {
  return (
    <div className="premium-card p-6">
      <p className="font-serif text-4xl font-bold text-gold-gradient">{value}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

export function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">
        {children}
      </p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

export function RouteCard({ number, icon: Icon, eyebrow, title, description, action, onAction, count, isActive }) {
  return (
    <div className={`premium-card group flex flex-col p-6 transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">
            {number} · {eyebrow}
          </p>
        </div>
        {typeof count === 'number' && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {count}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1"
      >
        {action}
      </button>
    </div>
  );
}

export function DepartmentChip({ label, sub, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-card group flex items-start gap-3 p-4 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        <FiUsers className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-serif text-base font-semibold text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
      </div>
    </button>
  );
}

export function JourneyCard({ title, steps, description, onStepClick }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400"
            >
              {step}
            </button>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60"
    >
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}