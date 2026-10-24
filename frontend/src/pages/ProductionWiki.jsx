import { useState } from 'react';
import { FiBookOpen, FiSearch, FiCpu } from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { runFeature } from '../genai/runner';

export default function ProductionWiki() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const ask = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runFeature({ featureId: 'production-wiki', input: query });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-500/15 p-3">
          <FiBookOpen className="h-6 w-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Production Wiki</h1>
          <p className="text-sm text-zinc-400">RAG-powered Q&A over scripts, schedules and contracts</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Ask about your production" icon={FiCpu} />
        <CardBody>
          <form onSubmit={ask} className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="wiki-query"
                name="wiki-query"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What is the shooting schedule for week 3?"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-500"
                aria-label="Ask the production wiki"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={loading} disabled={!query.trim()}>
                {loading ? 'Searching…' : 'Ask Wiki'}
              </Button>
            </div>
          </form>

          {result && (
            <div className={`mt-4 rounded-lg border p-4 ${result.ok ? 'border-brand-500/30 bg-brand-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              {result.ok ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-200">{result.output}</pre>
              ) : (
                <p className="text-sm text-red-400">{result.error}</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}