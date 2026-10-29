import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiVideo, FiEye, FiEdit2, FiX, FiArrowRight,
  FiFilm, FiUsers, FiCamera, FiMic, FiMusic, FiZap, FiMonitor,
  FiCheckCircle, FiHelpCircle, FiInbox, FiStar, FiClipboard, FiTrash2,
} from 'react-icons/fi';
import { SCENE_STATUSES } from '../utils/constants';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import KanbanBoard from '../components/KanbanBoard';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import SceneAIAnalysis from '../components/ai/SceneAIAnalysis';
import SentimentBadge from '../components/ai/SentimentBadge';
import PageHero from '../components/ui/PageHero';
import { analyzeSentiment } from '../ai/sentiment';
import { useToast } from '../context/ToastContext';
import {
  createScene, deleteScene, fetchScenes, updateScene, updateSceneStatus,
} from '../api/production';
import { getApiErrorMessage } from '../api/auth';

/* ——————————— The 8-stage production pipeline ——————————— */
const STAGE_ROUTES = [
  { number: '01', icon: FiClipboard, eyebrow: 'Development',      title: 'Script & Concept',      description: 'Break the screenplay into scenes. Track script versions, concept notes and narrative flow.', filter: 'Not Started' },
  { number: '02', icon: FiUsers,     eyebrow: 'Pre-Production',   title: 'Planning & Casting',    description: 'Assign crew, cast and locations. Plan shoot days, availability and scene order.',           filter: 'In Progress' },
  { number: '03', icon: FiCamera,    eyebrow: 'Shooting',         title: 'Principal Photography', description: 'Track what is shot, what is pending and what needs a reshoot. Manage takes and coverage.',   filter: 'Ready' },
  { number: '04', icon: FiFilm,      eyebrow: 'Post-Production',  title: 'Edit & Colour',         description: 'Move scenes into edit, colour and sound. Track VFX shots, ADR and final grading.',           filter: 'Shot' },
  { number: '05', icon: FiMonitor,   eyebrow: 'VFX',              title: 'Visual Effects',        description: 'Composite shots, CG assets and cleanup. Review approvals before the scene locks.',           filter: 'Cut' },
  { number: '06', icon: FiMusic,     eyebrow: 'Music & Sound',    title: 'Score & Mix',           description: 'Attach score, dialogue, foley and final mix. Lock the audio bed for every scene.',           filter: 'Locked' },
  { number: '07', icon: FiZap,       eyebrow: 'Delivery',         title: 'Final Cut',             description: 'Lock picture, export masters and prepare delivery formats for distribution.',                filter: 'Locked' },
  { number: '08', icon: FiCheckCircle, eyebrow: 'Release',        title: 'On Screen',             description: 'Mark scenes as released. Track final running order and audience-facing versions.',            filter: 'Locked' },
];

/* ——————————— Popular status filter chips ——————————— */
const POPULAR_STATUSES = ['Not Started', 'In Progress', 'Ready', 'Shot', 'Cut', 'Locked'];

export default function Scenes() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState([]);
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [selectedScene, setSelectedScene] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', location: '', timeOfDay: '', status: '' });
  const [newScene, setNewScene] = useState({ title: '', location: '', timeOfDay: '' });

  /* NEW: delete confirmation state */
  const [deletingScene, setDeletingScene] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (location.state?.openAdd) setAddOpen(true);
  }, [location.key, location.state]);

  useEffect(() => {
    let cancelled = false;
    fetchScenes()
      .then((results) => {
        if (!cancelled) setScenes(results);
      })
      .catch((error) => {
        if (!cancelled) toast(getApiErrorMessage(error, 'Could not load scenes.'), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const locations = [...new Set(scenes.map((scene) => scene.location).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

  const query = search.trim().toLowerCase();
  const filtered = scenes.filter((scene) => {
    const matchesSearch = !query || [scene.title, scene.location, scene.timeOfDay, ...(scene.tags || [])]
      .some((value) => String(value ?? '').toLowerCase().includes(query));
    const matchesStatus = !statusFilter || scene.status === statusFilter;
    const matchesLocation = !locationFilter || scene.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const counts = useMemo(() => {
    const c = { All: scenes.length };
    SCENE_STATUSES.forEach((status) => {
      c[status] = scenes.filter((scene) => scene.status === status).length;
    });
    return c;
  }, [scenes]);

  const totalLocations = locations.length;
  const totalTags = useMemo(() => {
    const set = new Set();
    scenes.forEach((scene) => (scene.tags || []).forEach((t) => set.add(t)));
    return set.size;
  }, [scenes]);

  const hasActiveFilters = Boolean(search || statusFilter || locationFilter);
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setLocationFilter('');
  };
  const scrollToBoard = () => {
    setTimeout(() => {
      document.getElementById('scenes-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const scrollToSearch = () => {
    setTimeout(() => {
      document.getElementById('scenes-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const applyStatusFilter = (status) => {
    setStatusFilter(status);
    scrollToBoard();
  };
  const toggleStatusFilter = (status) => {
    if (statusFilter === status) setStatusFilter('');
    else applyStatusFilter(status);
  };

  const move = async (id, status) => {
    const scene = scenes.find((item) => item.id === id);
    if (!scene) return;
    try {
      const updated = await updateSceneStatus(scene, status);
      setScenes((list) => list.map((item) => item.id === id ? updated : item));
      toast(`Moved to ${status}`, 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not update scene status.'), 'error');
    }
  };

  const addScene = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const scene = await createScene({
        ...newScene,
        number: Math.max(0, ...scenes.map((item) => Number(item.number) || 0)) + 1,
        status: SCENE_STATUSES[0],
      });
      setScenes((list) => [...list, scene]);
      setNewScene({ title: '', location: '', timeOfDay: '' });
      setAddOpen(false);
      toast('Scene added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save scene.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openSceneEdit = (scene) => {
    setEditingScene(scene);
    setEditForm({
      title: scene.title,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      status: scene.status,
    });
  };

  const saveSceneEdit = async (e) => {
    e.preventDefault();
    if (!editingScene) return;
    setSaving(true);
    try {
      const updated = await updateScene({
        ...editingScene,
        ...editForm,
      });
      setScenes((list) => list.map((scene) => scene.id === updated.id ? updated : scene));
      setSelectedScene(updated);
      setEditingScene(null);
      toast('Scene updated', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not update scene.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  /* NEW: open the delete-confirm modal */
  const requestDeleteScene = (scene) => {
    if (!scene) return;
    setDeletingScene(scene);
  };

  /* NEW: perform the actual delete */
  const confirmDeleteScene = async () => {
    if (!deletingScene) return;
    setDeleting(true);
    try {
      await deleteScene(deletingScene);
      setScenes((list) => list.filter((s) => s.id !== deletingScene.id));
      toast(`Deleted "${deletingScene.title}"`, 'success');
      if (selectedScene?.id === deletingScene.id) setSelectedScene(null);
      if (editingScene?.id === deletingScene.id) setEditingScene(null);
      setDeletingScene(null);
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not delete scene.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The Stage Where Stories Become Scenes"
        title="Every Scene, a Step Closer."
        subtitle="Every Frame, a Story Told."
        lead="Break the script into scenes. Track development, shooting, post-production and release. Assign crew, cast and locations. Move every scene from page to screen — with the pipeline, the people and the numbers in one place."
        slogan="Every scene has a purpose. Every take has a reason. The right plan, the right pace, the right craft can turn a screenplay into something audiences will remember long after the credits roll."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section id="scenes-search" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Right Scene</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Search by Title, Location or Tag.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Filter by status, location or keyword. Switch between the pipeline board and the list view.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, location, tag…"
                className="input pl-10"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => applyStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All statuses</option>
              {SCENE_STATUSES.map((status) => (
                <option key={status} value={status}>{status} ({counts[status] ?? 0})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Location</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setAddOpen(true)}>
            Add Scene
          </Button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400"
            >
              <FiX className="h-3 w-3" /> Clear filters
            </button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-zinc-500">
              Showing {filtered.length} of {scenes.length} scenes
            </span>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={scenes.length} label="Total scenes" note="In the current production" />
        <StatNumber value={(counts['Shot'] || 0) + (counts['Cut'] || 0) + (counts['Locked'] || 0)} label="Completed" note="Shot, cut or locked" />
        <StatNumber value={totalLocations} label="Locations" note="Across all scenes" />
        <StatNumber value={totalTags} label="Story tags" note="Themes and threads" />
      </section>

      {/* 4. QUOTE */}
      <Quote>
        "Every scene has a beginning, a middle and an end. Every film is what happens when those endings add up to something larger."
      </Quote>

      {/* 5. SIX STAGE ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Stage Are You Tracking?
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every scene moves through a pipeline. Choose the stage to focus on, and CHUTTEE surfaces the scenes that need your attention.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGE_ROUTES.map((stage) => (
            <RouteCard
              key={stage.number}
              number={stage.number}
              icon={stage.icon}
              eyebrow={stage.eyebrow}
              title={stage.title}
              description={stage.description}
              count={counts[stage.filter] ?? 0}
              isActive={statusFilter === stage.filter}
              action={statusFilter === stage.filter ? 'Clear filter' : 'View scenes →'}
              onAction={() => toggleStatusFilter(stage.filter)}
            />
          ))}
        </div>
      </section>

      {/* 6. QUOTE */}
      <Quote>
        "A scene is not just a page in a script. It is a promise that the next thirty seconds of the film will matter."
      </Quote>

      {/* 7. POPULAR STATUS CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Status</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Search the Way Directors Actually Think.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every scene lives in a status. One click shows everything that needs work.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_STATUSES.map((status) => (
            <StatusChip
              key={status}
              label={status}
              count={counts[status] ?? 0}
              isActive={statusFilter === status}
              onClick={() => toggleStatusFilter(status)}
            />
          ))}
        </div>
      </section>

      {/* 8. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Director Wants Clarity. A Crew Wants Direction.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person shaping the story, one for the person shooting it.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Directors & Producers"
            steps={['Break', 'Plan', 'Shoot', 'Edit', 'Lock', 'Release']}
            description="Break the script into scenes. Plan the shoot order. Track what is shot, what is pending and what needs a reshoot. Move scenes from board to final cut."
            onStepClick={(step) => {
              if (step === 'Break' || step === 'Plan') scrollToSearch();
              if (step === 'Shoot' || step === 'Edit') scrollToBoard();
              if (step === 'Lock' || step === 'Release') navigate('/activity');
            }}
          />
          <JourneyCard
            title="For Crew & Technicians"
            steps={['Brief', 'Prep', 'Shoot', 'Wrap', 'Log', 'Handoff']}
            description="See today's scenes. Prepare props, wardrobe and equipment. Shoot the setup. Log what happened. Hand off the footage with clear notes."
            onStepClick={(step) => {
              if (step === 'Brief' || step === 'Prep') scrollToBoard();
              if (step === 'Shoot' || step === 'Wrap') navigate('/crew');
              if (step === 'Log' || step === 'Handoff') navigate('/activity');
            }}
          />
        </div>
      </section>

      {/* 9. QUOTE */}
      <Quote>
        "The right scene is not the one with the best dialogue. It is the one that makes the next scene inevitable."
      </Quote>

      {/* 10. MAIN BOARD / TABLE */}
      <section id="scenes-board" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Pipeline</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Your Scenes, Board and List.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filtered.length} of {scenes.length} scenes shown
            {statusFilter && ` — filtered by ${statusFilter}`}
            {locationFilter && ` at ${locationFilter}`}.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            tabs={[{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }]}
            active={view}
            onChange={setView}
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
            </div>
          ) : view === 'board' ? (
            <KanbanBoard
              columns={SCENE_STATUSES}
              items={filtered}
              onMove={move}
              renderItem={(scene) => {
                const sentiment = analyzeSentiment(`${scene.title} ${(scene.tags || []).join(' ')}`);
                return (
                  <Card className="p-3 transition-all hover:border-gold-500/40 hover:scale-[1.02]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">#{scene.number}</p>
                      <div className="flex items-center gap-1.5">
                        <SentimentBadge sentiment={sentiment.overall} showScore={false} />
                        <button
                          onClick={() => openSceneEdit(scene)}
                          title={`Edit ${scene.title}`}
                          aria-label={`Edit ${scene.title}`}
                          className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-gold-400"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => requestDeleteScene(scene)}
                          title={`Delete ${scene.title}`}
                          aria-label={`Delete ${scene.title}`}
                          className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 font-serif text-base font-semibold text-zinc-100">{scene.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{scene.location} · {scene.timeOfDay}</p>
                    {scene.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {scene.tags.map((t) => (
                          <span key={t} className="rounded bg-gold-500/10 px-1.5 py-0.5 text-[9px] text-gold-400">#{t}</span>
                        ))}
                      </div>
                    )}
                    <SceneAIAnalysis scene={scene} />
                  </Card>
                );
              }}
            />
          ) : (
            <Table
              columns={[
                { key: 'number', label: '#', render: (r) => `#${r.number}` },
                { key: 'title', label: 'Scene', render: (r) => <span className="font-medium text-zinc-100">{r.title}</span> },
                { key: 'location', label: 'Location' },
                { key: 'timeOfDay', label: 'Time' },
                { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Shot' || r.status === 'Cut' ? 'success' : r.status === 'In Progress' ? 'warn' : 'default'}>{r.status}</Badge> },
                {
                  key: 'actions',
                  label: '',
                  render: (r) => (
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedScene(r)} title={`View ${r.title}`} aria-label={`View ${r.title}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800">
                        <FiEye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openSceneEdit(r)} title={`Edit ${r.title}`} aria-label={`Edit ${r.title}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800">
                        <FiEdit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => requestDeleteScene(r)} title={`Delete ${r.title}`} aria-label={`Delete ${r.title}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filtered}
            />
          )}
        </div>
      </section>

      {/* 11. QUOTE */}
      <Quote>
        "The best scene is the one nobody notices. It carries the story so smoothly that the audience forgets they are watching a film."
      </Quote>

      {/* 12. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Plan Your Next Scene?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Piece You Need Most.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiPlus}
            title="Add Scene"
            description="Log a new scene, its location and time of day."
            onAction={() => setAddOpen(true)}
          />
          <QuickAction
            icon={FiFilm}
            title="View Full Pipeline"
            description="See every scene by status — from script to screen."
            onAction={() => {
              clearFilters();
              scrollToBoard();
            }}
          />
          <QuickAction
            icon={FiCheckCircle}
            title="Assign Crew & Cast"
            description="Link a scene to crew, cast and shoot days."
            onAction={() => navigate('/crew', { state: { assignScene: true } })}
          />
        </div>
      </section>

      {/* 13. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">
              Planning a Complex Shoot? Tell Us About It.
            </h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:scenes@chuttee.in" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">scenes@chuttee.in</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+919876543210" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our production desk for scene breakdown and scheduling.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MODALS ═══════════ */}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Scene" icon={FiVideo} size="sm">
        <form onSubmit={addScene} className="space-y-4">
          <Input label="Scene title" value={newScene.title} onChange={(e) => setNewScene({ ...newScene, title: e.target.value })} required />
          <Input label="Location" value={newScene.location} onChange={(e) => setNewScene({ ...newScene, location: e.target.value })} required />
          <Input label="Time of day" value={newScene.timeOfDay} onChange={(e) => setNewScene({ ...newScene, timeOfDay: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Add Scene'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selectedScene} onClose={() => setSelectedScene(null)} title="Scene details" icon={FiVideo}>
        {selectedScene && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-serif text-base font-semibold text-zinc-100">#{selectedScene.number} {selectedScene.title}</p>
              <p className="text-zinc-400">Location: {selectedScene.location}</p>
              <p className="text-zinc-400">Time: {selectedScene.timeOfDay}</p>
              <p className="text-zinc-400">Status: {selectedScene.status}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                icon={FiTrash2}
                onClick={() => requestDeleteScene(selectedScene)}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Delete
              </Button>
              <Button variant="primary" icon={FiEdit2} onClick={() => openSceneEdit(selectedScene)}>Edit Scene</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editingScene} onClose={() => setEditingScene(null)} title="Edit Scene" icon={FiVideo} size="sm">
        <form onSubmit={saveSceneEdit} className="space-y-4">
          <Input label="Scene title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
          <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} required />
          <Input label="Time of day" value={editForm.timeOfDay} onChange={(e) => setEditForm({ ...editForm, timeOfDay: e.target.value })} required />
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            <span>Status</span>
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="input" required>
              {SCENE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              icon={FiTrash2}
              onClick={() => requestDeleteScene(editingScene)}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingScene(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* NEW: Delete confirmation modal */}
      <Modal
        open={!!deletingScene}
        onClose={() => !deleting && setDeletingScene(null)}
        title="Delete Scene"
        icon={FiTrash2}
        size="sm"
      >
        {deletingScene && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-zinc-100">
                #{deletingScene.number} {deletingScene.title}
              </span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingScene(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={FiTrash2}
                onClick={confirmDeleteScene}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting…' : 'Delete Scene'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
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
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">
        {children}
      </p>
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
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">
            {number} · {eyebrow}
          </p>
        </div>
        {typeof count === 'number' && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {count}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1"
      >
        {action}
      </button>
    </div>
  );
}

function StatusChip({ label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiStar className="h-4 w-4" />
        </span>
        <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
      </div>
      <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
        {count}
      </span>
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
            <button
              type="button"
              onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400"
            >
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