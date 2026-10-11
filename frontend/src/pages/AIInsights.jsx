import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { FiCpu, FiZap, FiAlertTriangle, FiDollarSign, FiUser, FiClock, FiSmile, FiAward, FiRefreshCw, FiTarget } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import SentimentBadge from '../components/ai/SentimentBadge';
import AISearch from '../components/ai/AISearch';
import { analyzeSentiment } from '../ai/sentiment';
import { detectAnomalies, detectCategorySpikes } from '../ai/anomaly';
import { predictSceneDuration, predictRisk, predictFestival, predictBudgetRunway } from '../ai/predictor';
import { matchCastToScene } from '../ai/matching';

export default function AIInsights() {
  const [tab, setTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const aiSearchRef = useRef(null);

  const project = MOCK.projects[0];
  const risks = predictRisk(MOCK.ai.filter((a) => a.kind === 'risk'));
  const { anomalies, stats } = detectAnomalies(MOCK.transactions);
  const spikes = detectCategorySpikes(MOCK.budgetByDept);
  const festival = predictFestival(project);
  const runway = predictBudgetRunway(project.budgetSpent, project.budgetTotal, 15000);
  const sceneSentiments = MOCK.scenes.map((s) => ({
    scene: s,
    sentiment: analyzeSentiment(`${s.title} ${(s.tags || []).join(' ')}`),
    duration: predictSceneDuration(s),
  }));
  const scene = MOCK.scenes[1];
  const castMatches = matchCastToScene(scene, MOCK.cast);

  const handleRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-500/15 p-3"><FiCpu className="h-6 w-6 text-brand-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">AI Insights</h1>
            <p className="text-sm text-zinc-400">Production intelligence, computed in your browser</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={handleRefresh} loading={refreshing}>Refresh</Button>
          <Button variant="primary" size="sm" icon={FiZap} onClick={() => aiSearchRef.current?.focus()}>Ask AI</Button>
        </div>
      </div>

      <AISearch inputRef={aiSearchRef} />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'budget', label: 'Budget' },
          { id: 'risks', label: 'Risks' },
          { id: 'sentiment', label: 'Sentiment' },
          { id: 'cast', label: 'Cast Match' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Top Priorities" subtitle="Ranked by impact score" icon={FiTarget} />
            <CardBody className="space-y-3">
              {risks.slice(0, 3).map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className={`rounded-lg p-2 ${r.quadrant === 'Critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}><FiAlertTriangle className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{r.title}</p>
                      <Badge variant={r.quadrant === 'Critical' ? 'danger' : 'warn'}>{r.quadrant}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-500">
                      <span>Probability: <span className="text-zinc-300">{r.probability}%</span></span>
                      <span>Impact: <span className="text-zinc-300">{r.impact}/10</span></span>
                      <span>Score: <span className="text-brand-400">{r.score}</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Festival Chances" icon={FiAward} />
            <CardBody>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-brand-400">{festival.winProbability}%</p>
                <p className="text-xs text-zinc-500">overall win probability</p>
              </div>
              <div className="space-y-2">
                {festival.festivals.map((f) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs text-zinc-300">{f.name}</span>
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${f.chance}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[10px] text-brand-400">{f.chance}%</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'budget' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader title="Budget by Department" subtitle="Planned vs actual" icon={FiDollarSign} />
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK.budgetByDept}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(value) => `₹${value / 100000}L`} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(value) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" />
                    <Bar dataKey="actual" fill="#d13f4d" radius={[4, 4, 0, 0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Budget Runway" icon={FiDollarSign} />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Days left" value={runway.daysLeft} accent="brand" />
                <Stat label="Weeks" value={runway.weeksLeft} />
                <Stat label="Avg tx" value={`₹${(stats?.mean / 1000).toFixed(0)}k`} />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">Burn rate</span>
                  <span className="text-zinc-300">₹{runway.dailyBurn.toLocaleString('en-IN')}/day</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className={`h-full rounded-full ${runway.status === 'critical' ? 'bg-red-500' : runway.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (runway.daysLeft / 60) * 100)}%` }} />
                </div>
                <p className={`mt-1 text-xs ${runway.status === 'critical' ? 'text-red-400' : runway.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {runway.status === 'critical' ? '⚠️ Critical' : runway.status === 'warning' ? '⚠️ Watch closely' : '✓ Healthy'}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Anomaly Detection" subtitle={`${anomalies.length} unusual transactions`} icon={FiAlertTriangle} />
            <CardBody className="space-y-2">
              {anomalies.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No anomalies detected 🎉</p>
              ) : (
                anomalies.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-200">{a.description}</p>
                      <p className="text-xs text-zinc-500">₹{a.amount.toLocaleString('en-IN')} · {a.category}</p>
                    </div>
                    <span className="ml-2 shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">{a.zScore}σ</span>
                  </div>
                ))
              )}
              {spikes.length > 0 && (
                <>
                  <p className="mt-3 text-xs font-semibold text-zinc-400">Over-budget categories</p>
                  {spikes.map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-lg bg-amber-500/5 p-2 text-xs">
                      <span className="text-zinc-300">{s.name}</span>
                      <span className="text-amber-400">+{s.variance}%</span>
                    </div>
                  ))}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'risks' && (
        <div className="grid gap-4 md:grid-cols-2">
          {risks.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${r.quadrant === 'Critical' ? 'bg-red-500/15 text-red-400' : r.quadrant === 'Severe' ? 'bg-orange-500/15 text-orange-400' : 'bg-amber-500/15 text-amber-400'}`}><FiAlertTriangle className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-sm">{r.title}</p>
                    <p className="text-xs text-zinc-500">Impact {r.impact}/10</p>
                  </div>
                </div>
                <Badge variant={r.quadrant === 'Critical' ? 'danger' : r.quadrant === 'Severe' ? 'warn' : r.quadrant === 'Likely' ? 'warn' : 'info'}>{r.quadrant}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                <MetricBar label="Probability" value={r.probability} max={100} suffix="%" />
                <MetricBar label="Impact" value={r.impact} max={10} suffix="/10" />
                <MetricBar label="Risk score" value={r.score * 10} max={100} suffix="" color="brand" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'sentiment' && (
        <Card>
          <CardHeader title="Script Sentiment Analysis" subtitle="Tone & emotion per scene" icon={FiSmile} />
          <CardBody className="space-y-3">
            {sceneSentiments.map(({ scene: s, sentiment, duration }) => (
              <div key={s.id} className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 md:flex-row md:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">#{s.number}</span>
                    <p className="truncate text-sm font-medium">{s.title}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <SentimentBadge sentiment={sentiment.overall} score={sentiment.confidence} />
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500"><FiClock className="h-3 w-3" /> {duration.minutes}m predicted</span>
                    <span className="text-[10px] text-zinc-500">Dominant: <span className="text-zinc-300">{sentiment.dominant}</span></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 md:w-48">
                  {Object.entries(sentiment.percentages).filter(([_, v]) => v > 0).slice(0, 3).map(([emotion, pct]) => (
                    <span key={emotion} className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{emotion} {pct}%</span>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {tab === 'cast' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader title="Target Scene" icon={FiTarget} />
            <CardBody>
              <p className="text-xs text-zinc-500">#{scene.number}</p>
              <p className="mt-1 text-sm font-medium">{scene.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{scene.location} · {scene.timeOfDay}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(scene.tags || []).map((t) => <span key={t} className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-400">#{t}</span>)}
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Recommended Cast" subtitle="Ranked by style + skill match" icon={FiUser} />
            <CardBody className="space-y-2">
              {castMatches.map((m, i) => (
                <motion.div key={m.actor.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-400">{m.actor.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.actor.name}</p>
                    <p className="truncate text-xs text-zinc-500">{m.reasons.join(' · ') || 'General skills'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-400">{m.score}%</p>
                    <p className="text-[10px] text-zinc-500">match</p>
                  </div>
                </motion.div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent === 'brand' ? 'text-brand-400' : 'text-zinc-100'}`}>{value}</p>
    </div>
  );
}

function MetricBar({ label, value, max, suffix = '', color = 'brand' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300">{value}{suffix}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color === 'brand' ? 'bg-gradient-to-r from-brand-500 to-brand-400' : 'bg-zinc-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}