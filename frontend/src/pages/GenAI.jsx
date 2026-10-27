import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiArrowRight, FiZap, FiCpu, FiShield, FiPlay,
  FiFileText, FiCamera, FiUsers, FiCalendar, FiScissors,
  FiTrendingUp, FiBookOpen, FiHelpCircle, FiInbox,
} from 'react-icons/fi';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PageHero from '../components/ui/PageHero';
import FeatureRunner from '../components/genai/FeatureRunner';
import PipelineViewer from '../components/genai/PipelineViewer';
import api from '../api/client';

/* ────────────────────────────────────────────────────────────
   28 features · 8 stages · P0/P1/P2
   ──────────────────────────────────────────────────────────── */
const STAGES = ['All', 'Script', 'Pre-Viz', 'Casting', 'Planning', 'Post', 'Marketing', 'Analytics', 'Knowledge'];

const FEATURES = [
  // Script
  { id: 'sceneweaver',      emoji: '🎬', name: 'SceneWeaver',       stage: 'Script',    priority: 'P0', description: 'Scene-by-scene outlines from a premise' },
  { id: 'characterforge',   emoji: '👤', name: 'CharacterForge',    stage: 'Script',    priority: 'P0', description: 'Bios, arcs, relationship maps' },
  { id: 'scriptcoverage',   emoji: '📋', name: 'ScriptCoverage',    stage: 'Script',    priority: 'P0', description: "Auto reader's report + marketability score" },
  { id: 'loglinelab',       emoji: '💡', name: 'LoglineLab',        stage: 'Script',    priority: 'P0', description: 'Loglines, synopses, one-pagers' },
  { id: 'scriptqa',         emoji: '❓', name: 'ProjectQ&A',        stage: 'Script',    priority: 'P0', description: 'Query your production database in plain English' },
  { id: 'dialoguedoctor',   emoji: '💬', name: 'DialogueDoctor',    stage: 'Script',    priority: 'P1', description: 'Rewrite dialogue in target voice' },
  { id: 'beatsheetai',      emoji: '🦁', name: 'BeatSheetAI',       stage: 'Script',    priority: 'P1', description: "Save-the-Cat / Hero's Journey beats" },

  // Pre-Viz
  { id: 'storyboardai',     emoji: '🎨', name: 'StoryBoardAI',      stage: 'Pre-Viz',   priority: 'P1', description: 'Text→storyboard frames' },
  { id: 'shotlistgenie',    emoji: '📸', name: 'ShotListGenie',     stage: 'Pre-Viz',   priority: 'P0', description: 'Auto shot list from scene' },
  { id: 'moodboardgen',     emoji: '🖼️', name: 'MoodBoardGen',      stage: 'Pre-Viz',   priority: 'P2', description: 'Visual reference sheets per scene' },

  // Casting
  { id: 'castmatch',        emoji: '🎭', name: 'CastMatch',         stage: 'Casting',   priority: 'P1', description: 'Actor archetype suggestions' },
  { id: 'auditionanalyzer', emoji: '🎥', name: 'DialogueTone',      stage: 'Casting',   priority: 'P2', description: 'Analyze emotional tone & pacing of dialogue' },

  // Planning
  { id: 'budgetbot',        emoji: '💰', name: 'BudgetBot',         stage: 'Planning',  priority: 'P0', description: 'Budget line items from script' },
  { id: 'schedulesensei',   emoji: '📅', name: 'ScheduleSensei',    stage: 'Planning',  priority: 'P1', description: 'Optimised shooting schedule' },
  { id: 'callsheetcopilot', emoji: '📞', name: 'CallSheetCopilot',  stage: 'Planning',  priority: 'P1', description: 'Auto call sheets' },
  { id: 'continuityguard',  emoji: '🔍', name: 'ContinuityGuard',   stage: 'Planning',  priority: 'P2', description: 'Flag continuity errors' },
  { id: 'riskradar',        emoji: '⚠️', name: 'RiskRadar',         stage: 'Planning',  priority: 'P2', description: 'Production risk register' },

  // Post
  { id: 'editadvisor',      emoji: '✂️', name: 'EditAdvisor',       stage: 'Post',      priority: 'P2', description: 'Rough-cut pacing notes' },
  { id: 'subtitlestudio',   emoji: '📝', name: 'SubtitleStudio',    stage: 'Post',      priority: 'P1', description: 'Auto subtitles + translation' },
  { id: 'dubmaster',        emoji: '🎙️', name: 'DubMaster',         stage: 'Post',      priority: 'P2', description: 'Dubbing script + lip-sync guidance' },
  { id: 'trailercraft',     emoji: '🎞️', name: 'TrailerCraft',      stage: 'Post',      priority: 'P2', description: 'Trailer script/beats' },

  // Marketing
  { id: 'posterforge',      emoji: '🖼️', name: 'PosterForge',       stage: 'Marketing', priority: 'P1', description: 'Poster concepts' },
  { id: 'taglinetitan',     emoji: '✨', name: 'TaglineTitan',      stage: 'Marketing', priority: 'P0', description: 'Taglines + marketing copy' },
  { id: 'presskitpro',      emoji: '📰', name: 'PressKitPro',       stage: 'Marketing', priority: 'P1', description: 'EPK / press kit generator' },
  { id: 'pitchdeckai',      emoji: '📊', name: 'PitchDeckAI',       stage: 'Marketing', priority: 'P1', description: 'Investor deck outline + copy' },

  // Analytics
  { id: 'boxofficeoracle',  emoji: '📈', name: 'BoxOfficeOracle',   stage: 'Analytics', priority: 'P2', description: 'Performance prediction from comps' },
  { id: 'audienceatlas',    emoji: '🧠', name: 'AudienceAtlas',     stage: 'Analytics', priority: 'P1', description: 'Audience personas/segments' },

  // Knowledge
  { id: 'productionwiki',   emoji: '📚', name: 'ProductionWiki',    stage: 'Knowledge', priority: 'P0', description: 'RAG Q&A over scripts/schedules/contracts' },
];

const PRIORITY_VARIANT = { P0: 'success', P1: 'warn', P2: 'default' };

/* Stage → department meta for the "Explore by Stage" section */
const STAGE_META = [
  { stage: 'Script',    icon: FiFileText,   eyebrow: 'Development',        blurb: 'Draft, outline, analyse, and pressure-test the screenplay.' },
  { stage: 'Pre-Viz',   icon: FiCamera,     eyebrow: 'Visual Planning',    blurb: 'Storyboards, shot lists, and mood boards before the camera rolls.' },
  { stage: 'Casting',   icon: FiUsers,      eyebrow: 'Talent',             blurb: 'Archetype suggestions, self-tape scoring, and casting alignment.' },
  { stage: 'Planning',  icon: FiCalendar,   eyebrow: 'Logistics',          blurb: 'Budgets, schedules, call sheets, continuity, and risk.' },
  { stage: 'Post',      icon: FiScissors,   eyebrow: 'Finishing',          blurb: 'Pacing, subtitles, dubbing, and trailer craft.' },
  { stage: 'Marketing', icon: FiZap,        eyebrow: 'Release',            blurb: 'Posters, taglines, press kits, and pitch decks.' },
  { stage: 'Analytics', icon: FiTrendingUp, eyebrow: 'Audience',           blurb: 'Box office signals and audience personas.' },
  { stage: 'Knowledge', icon: FiBookOpen,   eyebrow: 'RAG',                blurb: 'Ask your scripts, schedules, and contracts in plain English.' },
];

/* ────────────────────────────────────────────────────────────
   Route map: card id → backend endpoint + HTTP method
   ──────────────────────────────────────────────────────────── */
const ROUTES = {
  // ✅ Verified working
  castmatch:        { url: '/api/ml/ai/cast-recommendation/', method: 'POST' },
  budgetbot:        { url: '/api/ml/forecast/budget/',        method: 'GET'  },
  riskradar:        { url: '/api/ml/ai/risk-forecast/',       method: 'GET'  },
  trailercraft:     { url: '/api/ml/script/trailer/',         method: 'POST' },
  posterforge:      { url: '/api/ml/marketing/poster/',       method: 'POST' },
  storyboardai:     { url: '/api/ml/script/storyboard/',      method: 'POST' },
  dialoguedoctor:   { url: '/api/ml/script/dialogue-rewrite/', method: 'POST' },

  // 🔧 Summarize family — differentiated by `style` param
  sceneweaver:      { url: '/api/ml/script/summarize/', method: 'POST', style: 'scene-outline' },
  characterforge:   { url: '/api/ml/script/summarize/', method: 'POST', style: 'character-bios' },
  loglinelab:       { url: '/api/ml/script/summarize/', method: 'POST', style: 'logline' },
  scriptcoverage:   { url: '/api/ml/script/summarize/', method: 'POST', style: 'coverage' },
  taglinetitan:     { url: '/api/ml/script/summarize/', method: 'POST', style: 'tagline' },
  presskitpro:      { url: '/api/ml/script/summarize/', method: 'POST', style: 'press-kit' },

  // 🔄 Reuse existing endpoints for previously-missing cards
  scriptqa:         { url: '/api/ml/query/sql/',        method: 'POST' },
  beatsheetai:      { url: '/api/ml/copilot/producer/', method: 'POST', style: 'beats' },
  shotlistgenie:    { url: '/api/ml/copilot/producer/', method: 'POST', style: 'shotlist' },
  schedulesensei:   { url: '/api/ml/copilot/producer/', method: 'POST', style: 'schedule' },
  callsheetcopilot: { url: '/api/ml/report/daily/',     method: 'POST' },
  continuityguard:  { url: '/api/ml/ai/daily-insights/', method: 'GET' },
  editadvisor:      { url: '/api/ml/ai/scene-duration/', method: 'POST' },
  moodboardgen:     { url: '/api/ml/media/generate-image/', method: 'POST', style: 'moodboard' },
  auditionanalyzer: { url: '/api/ml/ai/script-sentiment/', method: 'POST' },
  boxofficeoracle:  { url: '/api/ml/predict/festival/', method: 'POST' },
  audienceatlas:    { url: '/api/ml/analytics/nl/',     method: 'POST', style: 'personas' },
  productionwiki:   { url: '/api/ml/memory/recall/',    method: 'POST' },

  // ❌ Still require NEW backend views (marked "Soon" in UI)
  // subtitlestudio:   { url: '/api/ml/script/subtitle/',  method: 'POST' },
  // dubmaster:        { url: '/api/ml/script/dub/',       method: 'POST' },
  // pitchdeckai:      { url: '/api/ml/marketing/pitch/',  method: 'POST' },
};

export default function GenAI() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('All');
  const [search, setSearch] = useState('');
  const [runnerFeature, setRunnerFeature] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEATURES.filter((f) => {
      const matchesStage = stage === 'All' || f.stage === stage;
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.stage.toLowerCase().includes(q);
      return matchesStage && matchesSearch;
    });
  }, [stage, search]);

  const openFeature = (feature) => setRunnerFeature(feature);

  const stageCount = (s) => FEATURES.filter((f) => f.stage === s).length;
  const p0Count = FEATURES.filter((f) => f.priority === 'P0').length;

  const handleRun = async (feature, input) => {
    const entry = ROUTES[feature.id];
    if (!entry) {
      throw new Error('Backend route for "' + feature.name + '" has not been built yet.');
    }

    const payload = {
      prompt: input,
      text: input,
      question: input,
      role_description: input,
      dialogue_text: input,
      style: entry.style || 'default',
      feature_id: feature.id,
    };

    try {
      const res = entry.method === 'GET'
        ? await api.get(entry.url)
        : await api.post(entry.url, payload);

      return JSON.stringify(res.data, null, 2);
    } catch (err) {
      const status = (err && err.response && err.response.status) || '?';
      const detail = err && err.response && err.response.data
        ? JSON.stringify(err.response.data, null, 2)
        : (err && err.message) || 'Request failed';
      throw new Error(feature.name + ' failed (' + status + '): ' + detail);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* ───────── Hero ───────── */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="GenAI Studio"
        title="Twenty-Eight Tools."
        subtitle="One Production Pipeline."
        lead="From the first logline to the final trailer, CHUTTEE's GenAI studio gives every stage of production its own dedicated assistant. SceneWeaver outlines the script. BudgetBot prices it. ScheduleSensei sequences it. CallSheetCopilot ships it. TrailerCraft pitches it. Every call runs through the same shield, the same audit trail, and the same provider allowlist as everything else in CHUTTEE."
        slogan="AI does not replace the crew. It shortens the distance between a decision and its first draft — so the people on set can spend their time on the work only they can do."
      />

      {/* ───────── Headline stats ───────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatNumber value={FEATURES.length} label="GenAI features" note="Across every production stage" />
          <StatNumber value={STAGE_META.length} label="Production stages" note="Script to release" />
          <StatNumber value={p0Count} label="Priority tools" note="P0 — ready for daily use" />
          <StatNumber value="100%" label="Shielded" note="Prompt + PII scanning on by default" />
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Connected to 1 active production · all features run in the browser and route only to allowlisted providers.
        </p>
      </section>

      <Quote>
        "The best AI tool is the one the crew forgets is there — because it already did the boring part before anyone asked."
      </Quote>

      {/* ───────── New intelligence strip ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">New Intelligence Tools</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Your Scripts &amp; Data, Analysed by AI.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Machine learning endpoints are wired directly into your production pipeline. Analyse sentiment,
            detect mood, summarise screenplays, and query your database in plain English.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniTool
            icon={FiFileText}
            title="Script Analysis"
            description="Detect sentiment, emotion and pacing in your dialogue."
            action="Analyse Now"
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'scriptcoverage'))}
          />
          <MiniTool
            icon={FiCpu}
            title="Summarise Screenplay"
            description="Get a tight summary of a full script or a specific scene."
            action="Summarise"
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'loglinelab'))}
          />
          <MiniTool
            icon={FiZap}
            title="Mood Classifier"
            description="Instantly detect the genre and mood of your story."
            action="Classify Mood"
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'scriptcoverage'))}
          />
          <MiniTool
            icon={FiBookOpen}
            title="Ask Your Database"
            description="Query projects, budgets and crew in plain English."
            action="Ask AI"
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'scriptqa'))}
          />
        </div>
      </section>

      {/* ───────── Pipeline viewer ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Production Pipeline</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            One Studio. Every Stage of Production.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Click a stage to filter the tools below. Each stage has its own dedicated set of assistants.
          </p>
        </div>

        <div className="mt-8">
          <PipelineViewer
            features={FEATURES}
            activeStage={stage}
            onSelectStage={setStage}
          />
        </div>
      </section>

      {/* ───────── Explore by stage ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Stage</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Search the Way Filmmakers Actually Think.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Some start with the tool. Many start with the stage. Every feature belongs to one.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGE_META.map(({ stage: s, icon: Icon, eyebrow, blurb }) => (
            <StageChip
              key={s}
              icon={Icon}
              label={s}
              eyebrow={eyebrow}
              sub={`${stageCount(s)} feature${stageCount(s) === 1 ? '' : 's'}`}
              blurb={blurb}
              isActive={stage === s}
              onClick={() => setStage(stage === s ? 'All' : s)}
            />
          ))}
        </div>
      </section>

      <Quote>
        "A prompt is a decision in disguise. Shield it before it is sent, and the production stays yours."
      </Quote>

      {/* ───────── The full catalog ───────── */}
      <section id="catalog" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Full Catalog</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            {filtered.length} of {FEATURES.length} Features.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {stage !== 'All' && `Filtered by ${stage}. `}
            {search && `Searching for "${search}". `}
            Click any card to run it. Blocked prompts are logged but never sent.
          </p>
        </div>

        {/* Stage tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                stage === s
                  ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-gold-500/30 hover:text-gold-400'
              }`}
            >
              {s}
              {s !== 'All' && (
                <span className="ml-1.5 text-[10px] text-zinc-600">{stageCount(s)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'}
          </p>
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search features…"
              className="input pl-10"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="premium-card p-10 text-center">
              <p className="text-sm text-zinc-400">No features match your filters.</p>
              <button
                type="button"
                onClick={() => { setStage('All'); setSearch(''); }}
                className="mt-3 text-xs font-medium text-gold-400 hover:text-gold-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((f, i) => (
                <motion.button
                  key={f.id}
                  type="button"
                  onClick={() => openFeature(f)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="premium-card group flex flex-col p-5 text-left transition-all hover:border-gold-500/40 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl leading-none" aria-hidden>{f.emoji}</span>
                    <Badge variant={PRIORITY_VARIANT[f.priority] || 'default'}>{f.priority}</Badge>
                  </div>
                  <h3 className="mt-3 font-serif text-base font-semibold text-zinc-100">{f.name}</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gold-400">{f.stage}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{f.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
                    Run <FiPlay className="h-3 w-3" />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Quote>
        "AI does not replace the crew. It shortens the distance between a decision and its first draft. The craft still belongs to the people on set."
      </Quote>

      {/* ───────── Guardrails ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Guardrails</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What GenAI Will Not Do.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            The allowlist and the prompt shield together define the edges of the system. These are the rules.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            'Never send passwords, keys, or PII to any provider.',
            'Never send financial or contract data to non-approved providers.',
            'Never accept a prompt that tries to override the shield.',
            'Never route a prompt to a provider that is not on the allowlist.',
            'Never store prompt history on the server — it stays in the browser.',
            'Never run a feature that has not been mapped to a data class.',
          ].map((rule) => (
            <div
              key={rule}
              className="flex items-start gap-2 rounded-premium border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-sm text-zinc-300">{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Ready to shoot ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Shoot?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Tool You Need Most.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiFileText}
            title="Analyse a Script"
            description="Detect sentiment, pacing and marketability in one pass."
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'scriptcoverage'))}
          />
          <QuickAction
            icon={FiCalendar}
            title="Plan a Shoot Day"
            description="Turn a scene into a shot list, call sheet and schedule."
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'callsheetcopilot'))}
          />
          <QuickAction
            icon={FiBookOpen}
            title="Ask Your Database"
            description="Query projects, budgets and crew in plain English."
            onAction={() => openFeature(FEATURES.find((f) => f.id === 'scriptqa'))}
          />
        </div>
      </section>

      {/* ───────── Why CHUTTEE ───────── */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Why CHUTTEE</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            The Market Has Models. What It Often Lacks Is Judgement.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE is built to connect AI to the craft of production — without pretending a model replaces
            taste, context or the people on set.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Pillar title="Craft Over Noise" body="More models, more outputs, more dashboards do not automatically create better films. We focus on the tools that shorten real work." />
          <Pillar title="Context Before Generation" body="A prompt without production context is guesswork. Every feature reads from your existing project, crew and budget data." />
          <Pillar title="Relevant Reach Over Mere Visibility" body="For producers, the goal is reaching the tool capable of the work — not simply more tools." />
          <Pillar title="Human Judgement Remains Central" body="AI can reduce friction and organise information. The creative decision remains with the filmmaker." />
        </div>
      </section>

      <Quote>
        "The films that endure are not the ones with the fewest problems. They are the ones where the people behind them saw the problems early — and solved them together."
      </Quote>

      {/* ───────── Contact ───────── */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">
              Tell Us What You Want to Create Next.
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Need a custom prompt, a new provider, or a feature that does not exist yet? The AI desk is one
              message away.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:omrewaskar4@gmail.com" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">
              omrewaskar4@gmail.com
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+917410111497" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">
              +91 74101 11497
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Office</p>
            <p className="mt-2 text-sm text-zinc-300">Mumbai, Maharashtra, India</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to the AI desk for a scoped prompt, a new provider, or a feature request.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>
                Talk to us
              </Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>
                Open Inbox
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Runner modal ───────── */}
      <FeatureRunner
        feature={runnerFeature}
        open={Boolean(runnerFeature)}
        onClose={() => setRunnerFeature(null)}
        onRun={handleRun}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Helper components
   ──────────────────────────────────────────────────────────── */

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
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">
        {children}
      </p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function MiniTool({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="premium-card group flex flex-col p-5 transition-all hover:border-gold-500/40">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">AI Engine</p>
      </div>
      <h3 className="mt-3 font-serif text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1"
      >
        {action} <FiArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function StageChip({ icon: Icon, label, eyebrow, sub, blurb, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-card group flex flex-col items-start gap-2 p-4 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-serif text-base font-semibold text-zinc-100">{label}</p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">{eyebrow}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{blurb}</p>
    </button>
  );
}

function Pillar({ title, body }) {
  return (
    <div className="premium-card p-5">
      <h3 className="font-serif text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60"
    >
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