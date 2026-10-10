import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiUser } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import Lightbox from '../components/Lightbox';
import { useToast } from '../context/ToastContext';
import { createCastMember, fetchCast } from '../api/production';
import { getApiErrorMessage } from '../api/auth';

export default function Cast() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cast, setCast] = useState([]);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState(-1);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newActor, setNewActor] = useState({ name: '', character: '', age: '' });

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

  const filtered = cast.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const addActor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const actor = await createCastMember(newActor);
      setCast((list) => [...list, actor]);
      setNewActor({ name: '', character: '', age: '' });
      setAddOpen(false);
      toast('Cast member added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save cast member.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cast</h1>
          <p className="text-sm text-zinc-400">{filtered.length} actors</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setAddOpen(true)}>Add Cast</Button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cast…" className="input pl-10" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FiUser} title="No cast found" description="Add your first actor to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((actor, i) => (
            <motion.div key={actor.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden transition-all hover:border-brand-500/40 hover:scale-[1.02]">
                <button onClick={() => setLightbox(i)} className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-brand-500/20 via-zinc-800 to-zinc-900 text-5xl font-bold text-brand-400 transition-transform hover:scale-[1.02]">
                  {actor.name.charAt(0)}
                </button>
                <div className="p-4">
                  <p className="font-semibold">{actor.name}</p>
                  <p className="text-xs text-zinc-500">as {actor.character} · age {actor.age}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {actor.skills?.map((s) => <span key={s} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>)}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {lightbox >= 0 && (
        <Lightbox
          images={filtered.map((a) => `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=512&background=18181b&color=d13f4d`)}
          index={lightbox}
          onClose={() => setLightbox(-1)}
          onChange={setLightbox}
        />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Cast Member" icon={FiUser} size="sm">
        <form onSubmit={addActor} className="space-y-4">
          <Input label="Name" value={newActor.name} onChange={(e) => setNewActor({ ...newActor, name: e.target.value })} required />
          <Input label="Character" value={newActor.character} onChange={(e) => setNewActor({ ...newActor, character: e.target.value })} required />
          <Input label="Age" type="number" min="1" value={newActor.age} onChange={(e) => setNewActor({ ...newActor, age: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Add Cast'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}