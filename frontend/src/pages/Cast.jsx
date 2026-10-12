import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiUser, FiTrash2, FiBell } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import Lightbox from '../components/Lightbox';
import { useToast } from '../context/ToastContext';
import { createCastMember, deleteCastMember, fetchCast } from '../api/production';
import { getApiErrorMessage } from '../api/auth';

const CAST_CATEGORIES = [
  'Actor',
  'Actress',
  'Child Artist',
  'Supporting Actor',
  'Extra',
  'Cameo',
  'Voice Actor',
  'Stunt Performer',
  'Body Double',
  'Modern Dance',
  'Classical Dance',
  'Folk Dance',
  'Hip-Hop Dance',
  'Contemporary Dance',
  'Choreographer',
  'Dance Troupe',
  'Singing',
  'Playback Singer',
  'Classical Vocalist',
  'Rapper',
  'Music Composer',
  'Lyricist',
  'Instrumentalist',
  'Director',
  'Assistant Director',
  'Script Writer',
  'Screenplay Writer',
  'Dialogue Writer',
  'Producer',
  'Executive Producer',
  'Line Producer',
  'Production Manager',
  'Casting Director',
  'Cinematographer',
  'Camera Operator',
  'Drone Operator',
  'Sound Engineer',
  'Boom Operator',
  'Gaffer',
  'Art Director',
  'Costume Designer',
  'Makeup Artist',
  'Hair Stylist',
  'Editor',
  'Colorist',
  'VFX Artist',
  'Animation Artist',
  'Theatre Acting',
  'Monologue Delivery',
  'Stand-up Comedy',
  'Improv',
  'Stage Combat',
  'Bollywood Dance',
  'Yoga',
  'Swimming',
  'Horse Riding',
  'Guitar',
  'Cooking',
  'Cooking Show Host',
  'Accents: British',
  'Accents: American',
  'Accents: Punjabi',
  'Accents: Tamil',
  'Accents: Malayalam',
  'Crew',
];

const getCategories = (a) => {
  if (Array.isArray(a.categories) && a.categories.length) return a.categories;
  if (a.category) return [a.category];
  return ['Actor'];
};

export default function Cast() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cast, setCast] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lightbox, setLightbox] = useState(-1);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newActor, setNewActor] = useState({
    name: '',
    character: '',
    age: '',
    categories: ['Actor'],
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCast()
      .then((results) => {
        if (!cancelled) setCast(results);
      })
      .catch((error) => {
        if (!cancelled) toast(getApiErrorMessage(error, 'Could not load cast members.'), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // All filter options: "All" + every known category.
  // Sorted alphabetically below "All" for easy scanning.
  const filterOptions = useMemo(
    () => ['All', ...[...CAST_CATEGORIES].sort((a, b) => a.localeCompare(b))],
    []
  );

  const counts = useMemo(() => {
    const c = { All: cast.length };
    CAST_CATEGORIES.forEach((cat) => {
      c[cat] = cast.filter((a) => getCategories(a).includes(cat)).length;
    });
    return c;
  }, [cast]);

  const filtered = cast.filter((a) => {
    const cats = getCategories(a);
    const matchesFilter = filter === 'All' || cats.includes(filter);
    if (!matchesFilter) return false;
    const q = (search ?? '').trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      (a.character || '').toLowerCase().includes(q) ||
      cats.some((c) => c.toLowerCase().includes(q))
    );
  });

  const toggleNewCategory = (cat) => {
    setNewActor((cur) => {
      const has = cur.categories.includes(cat);
      const next = has ? cur.categories.filter((c) => c !== cat) : [...cur.categories, cat];
      if (next.length === 0) return cur;
      return { ...cur, categories: next };
    });
  };

  const addActor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const actor = await createCastMember(newActor);
      setCast((list) => [...list, { ...actor, categories: actor.categories ?? newActor.categories }]);
      setNewActor({ name: '', character: '', age: '', categories: ['Actor'] });
      setAddOpen(false);
      toast('Cast member added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save cast member.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const target = confirmDelete;
    try {
      await deleteCastMember(target.id);
      setCast((list) => list.filter((a) => a.id !== target.id));
      toast(`${target.name} removed`, 'success');
      setConfirmDelete(null);
      if (lightbox >= 0) setLightbox(-1);
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not delete cast member.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cast</h1>
          <p className="text-sm text-zinc-400">{filtered.length} of {cast.length} members</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setAddOpen(true)}>
          Add Cast
        </Button>
      </div>

      {/* Filter + search row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <FiBell className="h-3.5 w-3.5 text-brand-400" />
            Category
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-full"
          >
            {filterOptions.map((tab) => (
              <option key={tab} value={tab}>
                {tab} ({counts[tab] ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[240px] flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-400">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cast…"
              className="input w-full pl-10"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} variant="card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiUser}
          title="No cast found"
          description={
            filter !== 'All'
              ? `No members in "${filter}" yet.`
              : search
                ? 'No cast members match your search.'
                : 'Add your first cast member to get started.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((actor, i) => (
            <motion.div
              key={actor.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="group relative overflow-hidden transition-all hover:border-brand-500/40 hover:scale-[1.02]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(actor);
                  }}
                  title="Delete cast member"
                  aria-label={`Delete ${actor.name}`}
                  className="absolute right-2 top-2 z-10 rounded-md bg-zinc-900/80 p-1.5 text-zinc-400 opacity-0 backdrop-blur transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setLightbox(i)}
                  className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-brand-500/20 via-zinc-800 to-zinc-900 text-5xl font-bold text-brand-400 transition-transform hover:scale-[1.02]"
                >
                  {actor.name.charAt(0)}
                </button>
                <div className="p-4">
                  <p className="font-semibold">{actor.name}</p>
                  <p className="text-xs text-zinc-500">
                    as {actor.character} · age {actor.age}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {getCategories(actor).map((cat) => (
                      <span
                        key={cat}
                        className="rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-400"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  {actor.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {actor.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {lightbox >= 0 && (
        <Lightbox
          images={filtered.map(
            (a) =>
              `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=512&background=18181b&color=d13f4d`
          )}
          index={lightbox}
          onClose={() => setLightbox(-1)}
          onChange={setLightbox}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Delete Cast Member"
        icon={FiTrash2}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-semibold text-white">{confirmDelete?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemove}
              disabled={deleting}
              icon={FiTrash2}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Cast Member"
        icon={FiUser}
        size="sm"
      >
        <form onSubmit={addActor} className="space-y-4">
          <Input
            label="Name"
            value={newActor.name}
            onChange={(e) => setNewActor({ ...newActor, name: e.target.value })}
            required
          />
          <Input
            label="Character"
            value={newActor.character}
            onChange={(e) => setNewActor({ ...newActor, character: e.target.value })}
            required
          />
          <Input
            label="Age"
            type="number"
            min="1"
            value={newActor.age}
            onChange={(e) => setNewActor({ ...newActor, age: e.target.value })}
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Categories</label>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-md border border-zinc-800 p-2">
              {CAST_CATEGORIES.map((c) => {
                const selected = newActor.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleNewCategory(c)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Click to toggle. At least one category is required.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Cast'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}