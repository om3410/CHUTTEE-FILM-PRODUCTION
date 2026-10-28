import { useState } from 'react';
import { FiPlay, FiX, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import Button from '../ui/Button';

export default function FeatureRunner({ feature, open, onClose, onRun }) {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');

  if (!open || !feature) return null;

  const reset = () => {
    setInput('');
    setOutput(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleRun = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setError('');
    setOutput(null);
    try {
      const result = onRun
        ? await onRun(feature, input.trim())
        : await mockRun(feature, input.trim());
      setOutput(result);
    } catch (e) {
      setError(e?.message || 'The feature failed to run.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="premium-card relative w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>{feature.emoji}</span>
          <div>
            <h2 className="font-serif text-xl font-bold text-zinc-100">{feature.name}</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">
              {feature.stage} · {feature.priority || 'P0'}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-400">{feature.description}</p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Input
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={`Describe what you want ${feature.name} to produce…`}
            className="input w-full resize-none"
          />
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            icon={FiPlay}
            loading={running}
            onClick={handleRun}
            disabled={!input.trim()}
          >
            Run {feature.name}
          </Button>
        </div>

        {running && (
          <div className="mt-5 flex items-center gap-2 text-sm text-zinc-400">
            <FiLoader className="h-4 w-4 animate-spin text-gold-400" />
            Running…
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-premium border border-red-500/20 bg-red-500/5 p-3">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {output !== null && output !== undefined && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              <FiCheckCircle className="h-3.5 w-3.5" />
              Output
            </div>
            <div className="rounded-premium border border-zinc-800 bg-zinc-950/60 p-4">
              <StructuredOutput data={output} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StructuredOutput({ data }) {
  if (!data) return null;

  // 1. Image data URI (MoodBoardGen)
  if (typeof data === 'object' && data.image && typeof data.image === 'string' && data.image.startsWith('data:image/')) {
    return (
      <div>
        <img src={data.image} alt={data.prompt || 'Generated'} className="max-w-full rounded" />
        <p className="mt-2 text-xs text-zinc-500">Provider: {data.provider}</p>
      </div>
    );
  }

  // 2. Object with recognizable array field → render all array fields as tables
  const arrayKeys = ['recommendations', 'risks', 'risk_forecasts', 'personas', 'festival_predictions', 'forecasts', 'scenes', 'frames', 'storyboards', 'cast', 'line_items', 'rows', 'results'];
  if (typeof data === 'object' && !Array.isArray(data)) {
    const tables = [];
    for (const key of arrayKeys) {
      if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
        tables.push(<DataTable key={key} title={key.replace(/_/g, ' ')} rows={data[key]} />);
      }
    }
    if (tables.length > 0) {
      return <div className="space-y-6">{tables}</div>;
    }
  }

  // 3. Array of objects → table
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    return <DataTable rows={data} />;
  }

  // 4. Object with string/number fields → key-value cards
  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data).filter(([k, v]) =>
      v !== null && v !== undefined && k !== 'style' && k !== 'feature_id' && v !== ''
    );
    if (entries.length > 0) {
      return <KeyValueCards entries={entries} />;
    }
  }

  // 5. String → prose
  if (typeof data === 'string') {
    return <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{data}</pre>;
  }

  // 6. Fallback — JSON
  return <pre className="whitespace-pre-wrap text-xs text-zinc-400">{JSON.stringify(data, null, 2)}</pre>;
}

function DataTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;

  const columns = Object.keys(rows[0]).filter(
    (k) => !['id', 'cast_id', 'project_id', 'created_at', 'updated_at'].includes(k)
  );

  return (
    <div>
      {title && (
        <h3 className="mb-2 text-xs uppercase tracking-[0.15em] text-gold-400">{title}</h3>
      )}
      <div className="overflow-x-auto rounded border border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold uppercase tracking-wider text-zinc-400">
                  {c.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2 text-zinc-300 align-top">
                    {renderCell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KeyValueCards({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-gold-400">
            {k.replace(/_/g, ' ')}
          </div>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {renderValue(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    if (typeof v[0] === 'string') return v.join(', ');
    return JSON.stringify(v, null, 2);
  }
  return JSON.stringify(v, null, 2);
}

function renderCell(value) {
  if (value === null || value === undefined) return <span className="text-zinc-600">—</span>;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-zinc-600">—</span>;
    if (typeof value[0] === 'string') {
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {value.map((v, i) => <li key={i}>{v}</li>)}
        </ul>
      );
    }
    return <span className="text-zinc-500">[{value.length} items]</span>;
  }
  if (typeof value === 'object') {
    return <pre className="text-[10px] text-zinc-500">{JSON.stringify(value)}</pre>;
  }
  return String(value);
}

async function mockRun(feature, input) {
  await new Promise((r) => setTimeout(r, 900));
  return { message: `[${feature.name}] placeholder output for: "${input}"` };
}