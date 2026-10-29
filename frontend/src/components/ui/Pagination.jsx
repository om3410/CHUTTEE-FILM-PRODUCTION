import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page = 1, pageSize = 10, total = 0, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
      <p className="text-xs text-zinc-500">Showing <span className="text-zinc-300">{from}â€“{to}</span> of <span className="text-zinc-300">{total}</span></p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40">
          <FiChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onPageChange(p)} className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-gold-500 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>{p}</button>
          );
        })}
        <button onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page === pages} className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40">
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}