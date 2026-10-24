import { useState } from 'react';
import { FiPlay, FiX, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import Button from '../ui/Button';

/**
 * Runs a single GenAI feature.
 *
 * Props:
 *  - feature: { id, name, emoji, stage, description }   (required when open)
 *  - open: boolean
 *  - onClose: () => void
 *  - onRun: (feature, input) => Promise<string>         optional async runner
 *                                                        (falls back to a mock)
 */
export default function FeatureRunner({ feature, open, onClose, onRun }) {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  if (!open || !feature) return null;

  const reset = () => {
    setInput('');
    setOutput('');
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
    setOutput('');
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
      <div className="premium-card relative w-full max-w-2xl p-6">
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

        {output && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              <FiCheckCircle className="h-3.5 w-3.5" />
              Output
            </div>
            <pre className="max-h-64 overflow-auto rounded-premium border border-zinc-800 bg-zinc-950/60 p-4 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

async function mockRun(feature, input) {
  await new Promise((r) => setTimeout(r, 900));
  return `[${feature.name}] placeholder output for:\n\n"${input}"\n\nWire onRun to your real provider to replace this mock.`;
}