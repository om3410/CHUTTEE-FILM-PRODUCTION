import { useState } from 'react';
import { FiSearch, FiCpu, FiX } from 'react-icons/fi';
import { generateAIResponse } from '../../ai/engine';
import { MOCK } from '../../utils/constants';

const EXAMPLES = ['scenes with VFX', 'crew available this week', 'budget overruns', 'romantic scenes', 'high risk items'];

export default function AISearch({ onResults, placeholder = 'Ask AI or search…', inputRef }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e, searchTerm = query) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setError('');
    setLoading(true);
    try {
      const context = {
        project: MOCK.projects?.[0],
        crew: MOCK.crew,
        cast: MOCK.cast,
        scenes: MOCK.scenes,
        transactions: MOCK.transactions,
        budgetByDept: MOCK.budgetByDept,
        risks: MOCK.ai?.filter((a) => a.kind === 'risk') || [],
        activity: MOCK.activity,
      };
      const res = await generateAIResponse(searchTerm, context);
      setAnswer(res);
      onResults?.(res);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to generate an AI response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <FiCpu className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-24 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <button type="button" title="Clear search" aria-label="Clear search" onClick={() => { setQuery(''); setAnswer(null); setError(''); }} className="rounded p-1 text-zinc-500 hover:bg-zinc-800">
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="submit" disabled={!query.trim() || loading} className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-40">
            {loading ? (
              <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Thinking</>
            ) : (
              <><FiSearch className="h-3 w-3" /> Ask</>
            )}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {!answer && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setQuery(ex)} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-brand-500/50 hover:text-brand-400">
              {ex}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/[0.03] p-4">
          <p className="whitespace-pre-line text-sm text-zinc-200">{answer.text}</p>
          {answer.actions?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {answer.actions.map((a) => (
                <button key={a} onClick={() => handleSubmit(undefined, a)} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-brand-500/50 hover:text-brand-400">
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}