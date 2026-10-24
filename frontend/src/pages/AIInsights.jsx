import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  FiCpu, FiZap, FiAlertTriangle, FiDollarSign, FiUser, FiClock, FiSmile,
  FiAward, FiRefreshCw, FiTarget, FiArrowRight, FiDatabase, FiFileText,
  FiLayers, FiUploadCloud, FiSearch, FiCheckCircle, FiHelpCircle,
  FiInbox, FiUsers, FiActivity, FiShield,
} from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import SentimentBadge from '../components/ai/SentimentBadge';
import AISearch from '../components/ai/AISearch';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import { analyzeSentiment } from '../ai/sentiment';
import { detectAnomalies, detectCategorySpikes } from '../ai/anomaly';
import { predictSceneDuration, predictRisk, predictFestival, predictBudgetRunway } from '../ai/predictor';
import { matchCastToScene } from '../ai/matching';
import { askDatabase, analyzeScript, summarizeScript, classifyMood } from '../api/ai';

const CONTACT = {
  email: 'omrewaskar4@gmail.com',
  phone: '+91 74101 14971',
  phoneRaw: '+917410114971',
};

export default function AIInsights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [topTab, setTopTab] = useState('insights');
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

  const openTab = (id) => {
    setTopTab('insights');
    setTab(id);
    setTimeout(() => document.getElementById('ai-tabs')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The CHUTTEE GenAI & Production Intelligence Studio"
        title="Every Signal, Read."
        subtitle="Every Risk, Foreseen."
        lead="Query your database in plain English. Analyse scripts for structure, characters and mood. Summarize screenplays for producers. Detect budget anomalies, predict runway, match cast to scenes. Powered by an 8-provider LLM fallback chain and client-side AI predictors."
        slogan="AI will not make the film for you. But it will give you the clarity, the foresight, and the time to make it better."
      />

      {/* SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ask Anything</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Question You Need Answered.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Ask about budgets, scenes, cast or crew. Or jump straight into a specific AI tool.
          </p>
        </div>

        <div className="mt-6">
          <AISearch inputRef={aiSearchRef} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiZap} onClick={() => aiSearchRef.current?.focus()}>Ask AI</Button>
          <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={handleRefresh} loading={refreshing}>Refresh Insights</Button>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={risks.length} label="Open risks" note="Across all productions" />
        <StatNumber value={anomalies.length} label="Anomalies" note="Unusual transactions" />
        <StatNumber value={`${festival.winProbability}%`} label="Festival chance" note="Top prediction" />
        <StatNumber value={`${runway.daysLeft}d`} label="Budget runway" note={`${runway.status} status`} />
      </section>

      <Quote>
        "A production is not measured by what it spends. It is measured by what it sees — and what it does before the problem arrives."
      </Quote>

      {/* 6 AI TOOL ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Do You Need AI For?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every AI tool is built for a specific production question. Choose the one you need.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouteCard
            number="01"
            icon={FiTarget}
            eyebrow="Overview"
            title="Top Priorities"
            description="See the risks that matter most this week, ranked by impact score."
            onAction={() => openTab('overview')}
          />
          <RouteCard
            number="02"
            icon={FiDollarSign}
            eyebrow="Finance"
            title="Budget Intelligence"
            description="Anomaly detection, over-budget categories, and budget runway forecast."
            onAction={() => openTab('budget')}
          />
          <RouteCard
            number="03"
            icon={FiAlertTriangle}
            eyebrow="Risks"
            title="Risk Radar"
            description="Every risk scored by probability, impact, and severity quadrant."
            onAction={() => openTab('risks')}
          />
          <RouteCard
            number="04"
            icon={FiSmile}
            eyebrow="Script"
            title="Sentiment Analysis"
            description="Emotion per scene, predicted duration, and dominant tone across the script."
            onAction={() => openTab('sentiment')}
          />
          <RouteCard
            number="05"
            icon={FiUser}
            eyebrow="Casting"
            title="Cast Match"
            description="Find the best actor for a specific scene — ranked by style and skill."
            onAction={() => openTab('cast')}
          />
          <RouteCard
            number="06"
            icon={FiCpu}
            eyebrow="GenAI Studio"
            title="Live AI Endpoints"
            description="Text-to-SQL, screenplay analyzer, summarizer, and mood classifier."
            onAction={() => setTopTab('studio')}
          />
        </div>
      </section>

      <Quote>
        "Every prediction is a chance to change the outcome. Every insight is a moment where a film can be saved before it needs saving."
      </Quote>

      {/* SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Foresight. A Team Wants Clarity.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person making decisions, one for the team executing them.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Showrunners"
            steps={['Review', 'Predict', 'Decide', 'Act', 'Report']}
            description="Review the top risks. Predict runway and anomalies. Decide what to cut or protect. Act before problems cost money. Report the outcome to stakeholders."
            onStepClick={(step) => {
              if (step === 'Review' || step === 'Decide') openTab('overview');
              if (step === 'Predict' || step === 'Act') openTab('budget');
              if (step === 'Report') navigate('/activity');
            }}
          />
          <JourneyCard
            title="For Crew & Technicians"
            steps={['Analyze', 'Ask', 'Match', 'Shoot', 'Log']}
            description="Analyze the script for emotion. Ask the AI anything about the production. Match cast to scenes. Shoot with confidence. Log activity for the record."
            onStepClick={(step) => {
              if (step === 'Analyze') openTab('sentiment');
              if (step === 'Ask') aiSearchRef.current?.focus();
              if (step === 'Match') openTab('cast');
              if (step === 'Shoot' || step === 'Log') navigate('/scenes');
            }}
          />
        </div>
      </section>

      <Quote>
        "A film is not what happens when everything goes right. It is what happens when the team sees the problem early and solves it together."
      </Quote>

      {/* TOP TABS — Insights vs Live Studio */}
      <section id="ai-tabs" className="scroll-mt-24">
        <div className="flex flex-wrap items-center gap-2 rounded-premium border border-zinc-800 bg-zinc-900/40 p-1 w-fit">
          <button
            onClick={() => setTopTab('insights')}
            className={`rounded-[10px] px-4 py-1.5 text-xs font-medium transition-all ${
              topTab === 'insights' ? 'bg-gold-500/15 text-gold-400' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Client-Side AI
          </button>
          <button
            onClick={() => setTopTab('studio')}
            className={`rounded-[10px] px-4 py-1.5 text-xs font-medium transition-all ${
              topTab === 'studio' ? 'bg-gold-500/15 text-gold-400' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Live GenAI Studio
          </button>
        </div>

        {/* ─── CLIENT-SIDE INSIGHTS ─── */}
        {topTab === 'insights' && (
          <div className="mt-6">
            <Tabs
              tabs={[
                { id: 'overview',  label: 'Overview' },
                { id: 'budget',    label: 'Budget' },
                { id: 'risks',     label: 'Risks' },
                { id: 'sentiment', label: 'Sentiment' },
                { id: 'cast',      label: 'Cast Match' },
              ]}
              active={tab}
              onChange={setTab}
            />

            <div className="mt-6">
              {tab === 'overview' && <OverviewTab risks={risks} festival={festival} />}
              {tab === 'budget' && (
                <BudgetTab
                  budgetData={MOCK.budgetByDept}
                  runway={runway}
                  anomalies={anomalies}
                  spikes={spikes}
                  stats={stats}
                />
              )}
              {tab === 'risks' && <RisksTab risks={risks} />}
              {tab === 'sentiment' && <SentimentTab sceneSentiments={sceneSentiments} />}
              {tab === 'cast' && <CastTab scene={scene} castMatches={castMatches} />}
            </div>
          </div>
        )}

        {/* ─── LIVE GENAI STUDIO ─── */}
        {topTab === 'studio' && (
          <div className="mt-6">
            <LiveStudio toast={toast} />
          </div>
        )}
      </section>

      <Quote>
        "The best productions are not the ones with the fewest surprises. They are the ones where every surprise was caught early."
      </Quote>

      {/* QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Ask AI?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Question You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiZap}
            title="Ask AI Anything"
            description="Query production data in plain English."
            onAction={() => aiSearchRef.current?.focus()}
          />
          <QuickAction
            icon={FiCpu}
            title="Open Live Studio"
            description="Text-to-SQL, script analyzer, summarizer, mood."
            onAction={() => { setTopTab('studio'); setTimeout(() => document.getElementById('ai-tabs')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          />
          <QuickAction
            icon={FiAlertTriangle}
            title="View Top Risks"
            description="Jump straight to what needs attention this week."
            onAction={() => openTab('risks')}
          />
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need a Custom AI Workflow? Tell Us What You Need.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.email}</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href={`tel:${CONTACT.phoneRaw}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.phone}</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out for AI integration support, custom workflows, or private deployments.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT-SIDE AI TABS
   ═══════════════════════════════════════════════════════════ */

function OverviewTab({ risks, festival }) {
  return (
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
                  <span>Score: <span className="text-gold-400">{r.score}</span></span>
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
            <p className="font-serif text-4xl font-bold text-gold-gradient">{festival.winProbability}%</p>
            <p className="text-xs text-zinc-500">overall win probability</p>
          </div>
          <div className="space-y-2">
            {festival.festivals.map((f) => (
              <div key={f.name} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-zinc-300">{f.name}</span>
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400" style={{ width: `${f.chance}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-[10px] text-gold-400">{f.chance}%</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function BudgetTab({ budgetData, runway, anomalies, spikes, stats }) {
  // FIX: guard against stats === null → avoids ₹NaNk render
  const meanAmount = stats?.mean ?? 0;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader title="Budget by Department" subtitle="Planned vs actual" icon={FiDollarSign} />
        <CardBody>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(value) => `₹${value / 100000}L`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => formatCurrency(value)}
                  isAnimationActive={false}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="budget" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" isAnimationActive={false} />
                <Bar dataKey="actual" fill="#d4af37" radius={[4, 4, 0, 0]} name="Actual" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Budget Runway" icon={FiDollarSign} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Days left" value={runway.daysLeft} accent />
            <Stat label="Weeks" value={runway.weeksLeft} />
            <Stat label="Avg tx" value={`₹${(meanAmount / 1000).toFixed(0)}k`} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400">Burn rate</span>
              <span className="text-zinc-300">₹{(runway.dailyBurn ?? 0).toLocaleString('en-IN')}/day</span>
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
  );
}

function RisksTab({ risks }) {
  return (
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
            <MetricBar label="Risk score" value={r.score * 10} max={100} suffix="" color="gold" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function SentimentTab({ sceneSentiments }) {
  return (
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
              {Object.entries(sentiment.percentages).filter(([, v]) => v > 0).slice(0, 3).map(([emotion, pct]) => (
                <span key={emotion} className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{emotion} {pct}%</span>
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function CastTab({ scene, castMatches }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader title="Target Scene" icon={FiTarget} />
        <CardBody>
          <p className="text-xs text-zinc-500">#{scene.number}</p>
          <p className="mt-1 text-sm font-medium">{scene.title}</p>
          <p className="mt-1 text-xs text-zinc-500">{scene.location} · {scene.timeOfDay}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {(scene.tags || []).map((t) => <span key={t} className="rounded bg-gold-500/10 px-2 py-0.5 text-[10px] text-gold-400">#{t}</span>)}
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Recommended Cast" subtitle="Ranked by style + skill match" icon={FiUser} />
        <CardBody className="space-y-2">
          {castMatches.map((m, i) => (
            <motion.div key={m.actor.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-sm font-bold text-gold-400">{m.actor.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.actor.name}</p>
                <p className="truncate text-xs text-zinc-500">{m.reasons.join(' · ') || 'General skills'}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg font-bold text-gold-400">{m.score}%</p>
                <p className="text-[10px] text-zinc-500">match</p>
              </div>
            </motion.div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LIVE GENAI STUDIO
   ═══════════════════════════════════════════════════════════ */

function LiveStudio({ toast }) {
  const [activeTab, setActiveTab] = useState('query');

  const STUDIO_TABS = [
    { id: 'query',     label: 'Text-to-SQL',     icon: FiDatabase },
    { id: 'analyze',   label: 'Script Analyzer', icon: FiLayers },
    { id: 'summarize', label: 'Summarizer',      icon: FiFileText },
    { id: 'mood',      label: 'Mood & Genre',    icon: FiZap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto border-b border-zinc-800">
        <div className="flex gap-6 px-2">
          {STUDIO_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap pb-4 pt-2 text-sm font-medium transition-all ${
                activeTab === id
                  ? 'border-b-2 border-gold-400 text-gold-400'
                  : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'query'     && <TextToSQLPanel toast={toast} />}
      {activeTab === 'analyze'   && <ScriptAnalyzePanel toast={toast} />}
      {activeTab === 'summarize' && <SummarizePanel toast={toast} />}
      {activeTab === 'mood'      && <MoodPanel toast={toast} />}
    </div>
  );
}

const SQL_SUGGESTIONS = [
  'Show the first 3 film projects with their title and total_budget',
  'List all crew members sorted by daily rate',
  'Which scenes are in progress?',
  'What is the total budget across all projects?',
];

function TextToSQLPanel({ toast }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await askDatabase(question);
      setResult(data);
      toast('Query executed', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not execute query.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="Ask the Database" subtitle="Plain English → SQL → Results" icon={FiDatabase} />
          <CardBody>
            <form onSubmit={ask} className="space-y-3">
              <div className="relative">
                <label htmlFor="sql-question" className="sr-only">Ask the database</label>
                <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="sql-question"
                  name="sql-question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Show the first 3 film projects with their title and total_budget"
                  className="input pl-10"
                  disabled={loading}
                  aria-label="Ask the database in plain English"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" icon={loading ? FiRefreshCw : FiZap} disabled={loading}>
                  {loading ? 'Thinking…' : 'Run Query'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader title="Generated SQL" icon={FiCpu} />
              <CardBody>
                <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-gold-300 font-mono">{result.sql}</pre>
                {result.explanation && <p className="mt-3 text-sm text-zinc-400">{result.explanation}</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Results" subtitle={`${result.row_count ?? 0} row${result.row_count === 1 ? '' : 's'}`} icon={FiCheckCircle} />
              <CardBody className="overflow-x-auto p-0">
                {result.columns && result.columns.length ? (
                  <table className="w-full text-sm">
                    <thead className="border-b border-zinc-800 text-left text-zinc-500">
                      <tr>
                        {result.columns.map((col) => (
                          <th key={col} className="px-5 py-3 font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(result.rows || []).map((row, i) => (
                        <tr key={i} className="border-b border-zinc-800 last:border-0">
                          {result.columns.map((col) => (
                            <td key={col} className="px-5 py-3 text-zinc-200">{String(row[col] ?? '—')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-5 py-6 text-center text-sm text-zinc-500">No rows returned.</p>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-serif text-lg font-bold text-zinc-100">Try Asking</h3>
        {SQL_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setQuestion(s)}
            className="w-full rounded-premium border border-zinc-800 bg-zinc-900/50 p-4 text-left text-sm text-zinc-300 transition-colors hover:border-gold-500/40 hover:text-gold-400"
          >
            "{s}"
          </button>
        ))}
      </div>
    </div>
  );
}

function ScriptAnalyzePanel({ toast }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeScript(file);
      setResult(data);
      toast('Script analyzed', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not analyze script.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Upload Screenplay" subtitle=".txt file — parser extracts structure" icon={FiUploadCloud} />
        <CardBody>
          <form onSubmit={upload} className="space-y-3">
            <label htmlFor="script-file" className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Screenplay File</span>
              <input
                id="script-file"
                name="script-file"
                type="file"
                accept=".txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input file:mr-3 file:rounded file:border-0 file:bg-gold-500/20 file:px-3 file:py-1 file:text-xs file:text-gold-400"
                aria-label="Upload screenplay file"
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={loading ? FiRefreshCw : FiLayers} disabled={loading || !file}>
                {loading ? 'Parsing…' : 'Analyze Script'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatNumber value={result.total_scenes ?? 0} label="Total scenes" note="Detected in script" />
            <StatNumber value={result.dialogue_count ?? 0} label="Dialogue lines" note="Across all characters" />
            <StatNumber value={Object.keys(result.characters || {}).length} label="Characters" note="Named speakers" />
            <StatNumber value={result.locations?.length || 0} label="Locations" note="Slug lines found" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Characters" subtitle="Dialogue count per character" icon={FiUsers} />
              <CardBody>
                {Object.entries(result.characters || {}).length === 0 ? (
                  <p className="text-sm text-zinc-500">No characters detected.</p>
                ) : (
                  Object.entries(result.characters || {}).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between border-b border-zinc-800 py-2 last:border-0">
                      <span className="text-sm text-zinc-200">{name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{count} lines</span>
                        <span className="text-xs font-medium text-gold-400">{result.speaking_percentage?.[name] ?? 0}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Locations" icon={FiSearch} />
              <CardBody>
                {result.locations?.length ? (
                  result.locations.map((loc) => (
                    <div key={loc} className="flex items-center gap-2 border-b border-zinc-800 py-2 last:border-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                      <span className="text-sm text-zinc-200">{loc}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No locations detected.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SummarizePanel({ toast }) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('short');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const summarize = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await summarizeScript(text, style);
      setResult(data);
      toast('Summary generated', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not summarize.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Summarize Screenplay" subtitle="Choose a length and tone" icon={FiFileText} />
        <CardBody>
          <form onSubmit={summarize} className="space-y-3">
            <label htmlFor="summarize-text" className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Screenplay Text</span>
              <textarea
                id="summarize-text"
                name="summarize-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste your screenplay or scene text here…"
                className="input w-full resize-none"
                disabled={loading}
                aria-label="Screenplay text to summarize"
              />
            </label>
            <label htmlFor="summarize-style" className="block sm:w-64">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Style</span>
              <select
                id="summarize-style"
                name="summarize-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="input"
                aria-label="Summary style"
              >
                <option value="short">Short (one paragraph)</option>
                <option value="producer">Producer pitch</option>
                <option value="ott">OTT pitch</option>
              </select>
            </label>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={loading ? FiRefreshCw : FiFileText} disabled={loading || !text.trim()}>
                {loading ? 'Summarizing…' : 'Summarize'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Summary" subtitle={`Style: ${result.style || style}`} icon={FiCheckCircle} />
          <CardBody>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{result.summary}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function MoodPanel({ toast }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const classify = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await classifyMood(text);
      setResult(data);
      toast('Mood classified', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not classify mood.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Mood & Genre Classifier" subtitle="Detect dominant genres with percentage confidence" icon={FiZap} />
        <CardBody>
          <form onSubmit={classify} className="space-y-3">
            <label htmlFor="mood-text" className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Screenplay Text</span>
              <textarea
                id="mood-text"
                name="mood-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste your screenplay or scene text here…"
                className="input w-full resize-none"
                disabled={loading}
                aria-label="Screenplay text for mood classification"
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={loading ? FiRefreshCw : FiZap} disabled={loading || !text.trim()}>
                {loading ? 'Classifying…' : 'Classify Mood'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Dominant Genre" icon={FiCheckCircle} />
            <CardBody>
              <p className="font-serif text-4xl font-bold text-gold-gradient">{result.dominant}</p>
              {result.reasoning && <p className="mt-3 text-sm text-zinc-400">{result.reasoning}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Genre Breakdown" icon={FiZap} />
            <CardBody className="space-y-4">
              {result.genres?.map((g) => (
                <div key={g.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-200">{g.name}</span>
                    <span className="font-medium text-gold-400">{g.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400" style={{ width: `${g.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function StatNumber({ value, label, note }) {
  return (
    <div className="premium-card p-6">
      <p className="font-serif text-4xl font-bold text-gold-gradient">{value}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">{children}</p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function RouteCard({ number, icon: Icon, eyebrow, title, description, onAction }) {
  return (
    <div className="premium-card group flex flex-col p-6 transition-all hover:border-gold-500/40">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{number} · {eyebrow}</p>
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Open tool <FiArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function JourneyCard({ title, steps, description, onStepClick }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <button type="button" onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400">
              {step}
            </button>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button type="button" onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60">
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-gold-400' : 'text-zinc-100'}`}>{value}</p>
    </div>
  );
}

function MetricBar({ label, value, max, suffix = '', color = 'gold' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300">{value}{suffix}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color === 'gold' ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-zinc-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}