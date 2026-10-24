import { useMemo } from 'react';

const STAGES = ['Script', 'Pre-Viz', 'Casting', 'Planning', 'Post', 'Marketing', 'Analytics', 'Knowledge'];

/**
 * Visualises the 8-stage production pipeline, highlighting the active stage
 * and showing how many features exist per stage.
 *
 * Props:
 *  - features: array of { stage }
 *  - activeStage: string | 'All'
 *  - onSelectStage: (stage) => void
 */
export default function PipelineViewer({ features = [], activeStage = 'All', onSelectStage }) {
  const counts = useMemo(() => {
    const map = {};
    for (const f of features) map[f.stage] = (map[f.stage] || 0) + 1;
    return map;
  }, [features]);

  return (
    <div className="premium-card p-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const active = activeStage === stage;
          return (
            <div key={stage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectStage?.(stage)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'border-gold-500/60 bg-gold-500/15 text-gold-400'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-gold-500/30 hover:text-gold-400'
                }`}
              >
                {stage}
                <span className="ml-1.5 text-[10px] text-zinc-600">{counts[stage] || 0}</span>
              </button>
              {i < STAGES.length - 1 && (
                <span className="h-px w-4 bg-zinc-800" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}