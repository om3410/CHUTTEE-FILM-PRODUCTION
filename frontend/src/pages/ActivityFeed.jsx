import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity, FiFilm, FiDollarSign, FiUserPlus, FiMessageSquare,
  FiSearch, FiX, FiArrowRight, FiDownload, FiCheckCircle,
  FiPlus, FiEdit2, FiTrash2, FiThumbsUp, FiUsers, FiHelpCircle, FiInbox,
} from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';

/* ——————————— Event types ——————————— */
const EVENT_TYPES = {
  scene_shot:    { label: 'Scene Shot',    icon: FiFilm,        accent: '#d4af37' },
  expense_added: { label: 'Expense Added', icon: FiDollarSign,  accent: '#f59e0b' },
  crew_added:    { label: 'Crew Added',    icon: FiUserPlus,    accent: '#3b82f6' },
  comment:       { label: 'Comment',       icon: FiMessageSquare, accent: '#a855f7' },
  edit:          { label: 'Edit',          icon: FiEdit2,       accent: '#10b981' },
  delete:        { label: 'Delete',        icon: FiTrash2,      accent: '#ef4444' },
  approval:      { label: 'Approval',      icon: FiThumbsUp,    accent: '#ec4899' },
};

/* ——————————— Route cards ——————————— */
const EVENT_ROUTES = [
  { number: '01', icon: FiFilm,          eyebrow: 'Production',  title: 'Scenes & Shoots',   description: 'Scene changes, shoot completions, and production milestones.',           types: ['scene_shot'] },
  { number: '02', icon: FiEdit2,         eyebrow: 'Updates',     title: 'Edits & Changes',   description: 'Who changed what, when, and on which production.',                       types: ['edit'] },
  { number: '03', icon: FiUserPlus,      eyebrow: 'People',      title: 'Crew & Cast',       description: 'New crew members, casting decisions, and role changes.',                 types: ['crew_added'] },
  { number: '04', icon: FiDollarSign,    eyebrow: 'Finance',     title: 'Budgets & Expenses', description: 'Expenses, invoices, and payment approvals.',                            types: ['expense_added'] },
  { number: '05', icon: FiMessageSquare, eyebrow: 'Collaboration', title: 'Comments & Notes', description: 'Discussions, @mentions, and feedback threads.',                         types: ['comment'] },
  { number: '06', icon: FiCheckCircle,   eyebrow: 'Approvals',   title: 'Reviews & Approvals', description: 'Sign-offs, rejections, and workflow decisions.',                      types: ['approval'] },
];

const POPULAR_FILTERS = [
  { key: 'scene_shot',    label: 'Scenes' },
  { key: 'expense_added', label: 'Expenses' },
  { key: 'crew_added',    label: 'Crew' },
  { key: 'comment',       label: 'Comments' },
  { key: 'edit',          label: 'Edits' },
  { key: 'approval',      label: 'Approvals' },
];

export default function ActivityFeed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    // Preserves your original mock load — swap for fetchActivity() later
    const t = setTimeout(() => {
      setItems(MOCK.activity);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  /* ——————————— Derived ——————————— */
  const counts = useMemo(() => {
    const c = { all: items.length };
    Object.keys(EVENT_TYPES).forEach((k) => {
      c[k] = items.filter((i) => i.type === k).length;
    });
    return c;
  }, [items]);

  const today = useMemo(() => {
    return items.filter((i) => {
      const t = String(i.timestamp ?? '').toLowerCase();
      return t.includes('minute') || t.includes('hour') || t.includes('today') || /^\d+m/.test(t) || /^\d+h/.test(t);
    }).length;
  }, [items]);

  const thisWeek = useMemo(() => {
    return items.filter((i) => {
      const t = String(i.timestamp ?? '').toLowerCase();
      return !t.includes('month') && !t.includes('year') && !/\d+mo/.test(t) && !/\d+y/.test(t);
    }).length;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesSearch = !q || [i.message, i.type].some((v) => String(v ?? '').toLowerCase().includes(q));
      const matchesType = !typeFilter || i.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  const hasActiveFilters = Boolean(search || typeFilter);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); };
  const scrollToTimeline = () => setTimeout(() => document.getElementById('activity-timeline')?.scrollIntoView({ behavior: 'smooth' }), 100);

  const countByTypes = (types) => items.filter((i) => types.includes(i.type)).length;

  const exportTimeline = () => {
    if (!items.length) {
      toast('No activity to export.', 'error');
      return;
    }
    try {
      const rows = [
        ['Type', 'Message', 'Timestamp'],
        ...items.map((i) => [EVENT_TYPES[i.type]?.label || i.type, i.message, i.timestamp]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chuttee-activity-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast('Activity exported to CSV', 'success');
    } catch (error) {
      toast('Could not export activity.', 'error');
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The Timeline of Your Studio"
        title="Every Action, Recorded."
        subtitle="Every Change, Accounted For."
        lead="See who updated what and when. Track project changes, crew additions, budget approvals and schedule shifts. Stay informed without asking. Keep the whole team on the same page — from the first update of the day to the last approval of the night."
        slogan="Every action has a reason. The right visibility, the right context, the right timing can turn a production team into a production family."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Event</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Change You Need to See.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by message or filter by event type. Find the exact moment that matters.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity…" className="input pl-10" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Event type</span>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); scrollToTimeline(); }} className="input">
              <option value="">All types</option>
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label} ({counts[key] ?? 0})</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" icon={FiDownload} onClick={exportTimeline}>Export CSV</Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filtered.length} of {items.length} events</span>
            </>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={items.length} label="Total events" note="Recorded in the timeline" />
        <StatNumber value={today} label="Today" note="Recent activity" />
        <StatNumber value={thisWeek} label="This week" note="Rolling 7 days" />
        <StatNumber value={Object.keys(EVENT_TYPES).length} label="Event types" note="Categories tracked" />
      </section>

      <Quote>
        "A timeline is not a list. It is the memory of how the film came together — one action, one decision, one moment at a time."
      </Quote>

      {/* 5. SIX EVENT ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Kind of Activity?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every event belongs to a category. Choose the one you need and CHUTTEE surfaces the timeline.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_ROUTES.map((route) => {
            const primary = route.types[0];
            const isActive = route.types.includes(typeFilter);
            return (
              <RouteCard
                key={route.number}
                number={route.number}
                icon={route.icon}
                eyebrow={route.eyebrow}
                title={route.title}
                description={route.description}
                count={countByTypes(route.types)}
                isActive={isActive}
                action={isActive ? 'Clear filter' : 'View events →'}
                onAction={() => {
                  if (isActive) setTypeFilter('');
                  else { setTypeFilter(primary); scrollToTimeline(); }
                }}
              />
            );
          })}
        </div>
      </section>

      <Quote>
        "The film you remember is not the one with the fewest changes. It is the one where every change was made on purpose."
      </Quote>

      {/* 7. POPULAR FILTER CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Event Type</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Producers Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            One click shows everything in that category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_FILTERS.map((f) => (
            <CategoryChip
              key={f.key}
              label={f.label}
              count={counts[f.key] ?? 0}
              isActive={typeFilter === f.key}
              onClick={() => {
                if (typeFilter === f.key) setTypeFilter('');
                else { setTypeFilter(f.key); scrollToTimeline(); }
              }}
            />
          ))}
        </div>
      </section>

      {/* 9. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Visibility. A Crew Wants Clarity.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person tracking every change, one for the person making them.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Showrunners"
            steps={['Watch', 'Review', 'Approve', 'Reconcile', 'Report']}
            description="Watch changes in real time. Review edits and expenses. Approve what matters. Reconcile the day. Report to stakeholders."
            onStepClick={(step) => {
              if (step === 'Watch' || step === 'Review') scrollToTimeline();
              if (step === 'Approve') setTypeFilter('approval');
              if (step === 'Reconcile' || step === 'Report') exportTimeline();
            }}
          />
          <JourneyCard
            title="For Crew & Technicians"
            steps={['Update', 'Comment', 'Attach', 'Confirm', 'Notify']}
            description="Update your work. Comment on scenes. Attach files. Confirm shoot days. Notify the team automatically."
            onStepClick={(step) => {
              if (step === 'Update') setTypeFilter('edit');
              if (step === 'Comment') setTypeFilter('comment');
              if (step === 'Attach' || step === 'Confirm') scrollToTimeline();
              if (step === 'Notify') toast('Team notified', 'success');
            }}
          />
        </div>
      </section>

      <Quote>
        "Every update is a promise to the team. Every approval is the moment the promise is kept."
      </Quote>

      {/* 11. MAIN TIMELINE */}
      <section id="activity-timeline" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Timeline</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Every Event, in Order.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filtered.length} of {items.length} events shown
            {typeFilter && ` — ${EVENT_TYPES[typeFilter]?.label ?? typeFilter}`}.
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FiActivity}
              title="No activity found"
              description={hasActiveFilters ? 'Try clearing the filters.' : 'Activity will appear here as your team works.'}
            />
          ) : (
            <Card className="p-6">
              <ol className="relative space-y-6 border-l border-zinc-800 pl-8">
                {filtered.map((a, i) => {
                  const cfg = EVENT_TYPES[a.type] || { label: a.type, icon: FiActivity, accent: '#71717a' };
                  const Icon = cfg.icon;
                  return (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative"
                    >
                      <span className="absolute -left-[50px] flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 ring-4 ring-zinc-950">
                        <span
                          className="grid h-7 w-7 place-items-center rounded-full"
                          style={{ backgroundColor: `${cfg.accent}22`, color: cfg.accent }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                      </span>
                      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: cfg.accent }}>
                        {cfg.label}
                      </p>
                      <p className="mt-1 font-serif text-base font-semibold text-zinc-100">{a.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">{a.timestamp}</p>
                    </motion.li>
                  );
                })}
              </ol>
            </Card>
          )}
        </div>
      </section>

      <Quote>
        "The films that endure are not the ones with the fewest changes. They are the ones where every change was tracked, understood, and made together."
      </Quote>

      {/* 14. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Track More?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Action You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiDownload}
            title="Export Timeline"
            description="Download every event as a CSV for archival or reporting."
            onAction={exportTimeline}
          />
          <QuickAction
            icon={FiUsers}
            title="View All Crew Activity"
            description="Filter the timeline to only crew additions and updates."
            onAction={() => { setTypeFilter('crew_added'); scrollToTimeline(); }}
          />
          <QuickAction
            icon={FiCheckCircle}
            title="View All Approvals"
            description="See every sign-off, rejection and workflow decision."
            onAction={() => { setTypeFilter('approval'); scrollToTimeline(); }}
          />
        </div>
      </section>

      {/* 15. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need to Trace a Change? Tell Us What Happened.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:activity@chuttee.in" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">activity@chuttee.in</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+919876543210" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our production desk for audit trails and historical records.
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER COMPONENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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

function RouteCard({ number, icon: Icon, eyebrow, title, description, action, onAction, count, isActive }) {
  return (
    <div className={`premium-card group flex flex-col p-6 transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{number} · {eyebrow}</p>
        </div>
        {typeof count === 'number' && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        {action}
      </button>
    </div>
  );
}

function CategoryChip({ label, count, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiActivity className="h-4 w-4" />
        </span>
        <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
      </div>
      <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
    </button>
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