import { FiBookmark, FiPlus, FiX } from 'react-icons/fi';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function SavedSearches({ currentQuery, onApply }) {
  const [searches, setSearches] = useLocalStorage('chuttee-saved-searches', []);

  const save = () => {
    if (!currentQuery?.trim()) return;
    const name = prompt('Name this search:', currentQuery);
    if (!name) return;
    setSearches([...searches, { id: Date.now(), name, query: currentQuery }]);
  };

  const remove = (id) => setSearches(searches.filter((s) => s.id !== id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {searches.map((s) => (
        <span key={s.id} className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
          <FiBookmark className="h-3 w-3 text-gold-400" />
          <button onClick={() => onApply(s.query)} className="hover:text-gold-400">{s.name}</button>
          <button onClick={() => remove(s.id)} title={`Remove ${s.name}`} aria-label={`Remove ${s.name}`} className="text-zinc-500 hover:text-red-400"><FiX className="h-3 w-3" /></button>
        </span>
      ))}
      {currentQuery?.trim() && (
        <button onClick={save} className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-gold-500 hover:text-gold-400">
          <FiPlus className="h-3 w-3" /> Save current
        </button>
      )}
    </div>
  );
}