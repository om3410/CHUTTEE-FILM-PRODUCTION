import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiChevronDown, FiClock, FiSmile, FiUser, FiZap } from 'react-icons/fi';
import { Card, CardBody } from '../ui/Card';
import SentimentBadge from './SentimentBadge';
import { analyzeSentiment } from '../../ai/sentiment';
import { predictSceneDuration } from '../../ai/predictor';
import { matchCastToScene } from '../../ai/matching';
import { MOCK } from '../../utils/constants';

export default function SceneAIAnalysis({ scene }) {
  const [open, setOpen] = useState(false);
  if (!scene) return null;

  const sentiment = analyzeSentiment(`${scene.title} ${(scene.tags || []).join(' ')}`);
  const duration = predictSceneDuration(scene);
  const castMatches = matchCastToScene(scene, MOCK.cast);

  return (
    <Card className="mt-3 border-brand-500/20 bg-brand-500/[0.02]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-brand-500/15 p-1.5 text-brand-400"><FiCpu className="h-3.5 w-3.5" /></div>
          <span className="text-xs font-semibold text-brand-400">AI Analysis</span>
          <SentimentBadge sentiment={sentiment.overall} score={sentiment.confidence} />
        </div>
        <FiChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CardBody className="space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <FiClock className="h-3 w-3" /> Predicted Duration
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-400">{duration.minutes}</span>
                  <span className="text-xs text-zinc-500">minutes</span>
                  <span className="ml-auto text-[10px] text-zinc-500">{duration.confidence}% confidence</span>
                </div>
                {duration.drivers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {duration.drivers.map((d) => (
                      <span key={d} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <FiSmile className="h-3 w-3" /> Emotion Breakdown
                </p>
                <div className="space-y-1.5">
                  {Object.entries(sentiment.percentages).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([emotion, pct]) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs capitalize text-zinc-400">{emotion}</span>
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[10px] text-zinc-500">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {castMatches.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <FiUser className="h-3 w-3" /> Suggested Cast
                  </p>
                  <div className="space-y-1.5">
                    {castMatches.slice(0, 3).map((m) => (
                      <div key={m.actor.id} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{m.actor.name}</p>
                          <p className="truncate text-[10px] text-zinc-500">{m.reasons.slice(0, 2).join(' · ') || 'Available'}</p>
                        </div>
                        <span className="ml-2 shrink-0 text-xs font-semibold text-brand-400">{m.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-md bg-zinc-900/60 p-2 text-[10px] text-zinc-500">
                <FiZap className="h-3 w-3 text-brand-400" />
                <span>Analysis runs locally · Results are deterministic per scene data</span>
              </div>
            </CardBody>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}