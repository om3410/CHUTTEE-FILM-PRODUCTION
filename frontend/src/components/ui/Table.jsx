export default function Table({ columns, data, keyField = 'id', empty = 'No records' }) {
  if (!data?.length) {
    return <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500 animate-fade-in">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 animate-fade-in">
      <table className="min-w-full divide-y divide-zinc-800">
        <thead className="bg-zinc-900/60">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {data.map((row) => (
            <tr key={row[keyField]} className="transition-colors hover:bg-zinc-900/40">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-zinc-300">{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}