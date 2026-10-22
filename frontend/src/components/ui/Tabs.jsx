import { cn } from '../../lib/utils';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-premium border border-zinc-800 bg-zinc-900/40 p-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'whitespace-nowrap rounded-[10px] px-4 py-1.5 text-sm font-medium transition-all',
            active === id ? 'bg-gold-500/15 text-gold-400' : 'text-zinc-500 hover:text-zinc-200'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
