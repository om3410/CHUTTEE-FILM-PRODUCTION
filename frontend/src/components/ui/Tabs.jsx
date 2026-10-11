export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-zinc-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${active === t.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}