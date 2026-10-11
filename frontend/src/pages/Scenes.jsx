import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiPlus, FiSearch, FiVideo, FiEye, FiEdit2, FiX } from 'react-icons/fi';
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
import { analyzeSentiment } from '../ai/sentiment';
import { useToast } from '../context/ToastContext';
import { createScene, fetchScenes, updateScene, updateSceneStatus } from '../api/production';
import { getApiErrorMessage } from '../api/auth';

export default function Scenes() {
  const { toast } = useToast();
  const location = useLocation();
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Scenes</h1>
          <p className="text-sm text-zinc-500">{filtered.length} of {scenes.length} scenes</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setAddOpen(true)}>Add Scene</Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs tabs={[{ id: 'board', label: 'Board' }, { id: 'list', label: 'List' }]} active={view} onChange={setView} />
          <div className="relative max-w-xs flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, location, or tag…" className="input pl-10" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-52" aria-label="Filter scenes by status">
            <option value="">All statuses</option>
            {SCENE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="input sm:w-64" aria-label="Filter scenes by location">
            <option value="">All locations</option>
            {locations.map((sceneLocation) => <option key={sceneLocation} value={sceneLocation}>{sceneLocation}</option>)}
          </select>
          {(search || statusFilter || locationFilter) && (
            <Button variant="outline" icon={FiX} onClick={() => { setSearch(''); setStatusFilter(''); setLocationFilter(''); }}>Clear filters</Button>
          )}
        </div>
      </div>

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
              <Card className="p-3 transition-colors hover:border-brand-500/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-zinc-500">#{scene.number}</p>
                  <div className="flex items-center gap-2">
                    <SentimentBadge sentiment={sentiment.overall} showScore={false} />
                    <button onClick={() => openSceneEdit(scene)} title={`Edit ${scene.title}`} aria-label={`Edit ${scene.title}`} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100">
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-0.5 text-sm font-medium">{scene.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{scene.location} · {scene.timeOfDay}</p>
                {scene.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {scene.tags.map((t) => <span key={t} className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] text-brand-400">#{t}</span>)}
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
            { key: 'actions', label: '', render: (r) => <div className="flex gap-1"><button onClick={() => setSelectedScene(r)} title={`View ${r.title}`} aria-label={`View ${r.title}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800"><FiEye className="h-3.5 w-3.5" /></button><button onClick={() => openSceneEdit(r)} title={`Edit ${r.title}`} aria-label={`Edit ${r.title}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800"><FiEdit2 className="h-3.5 w-3.5" /></button></div> },
          ]}
          data={filtered}
        />
      )}

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
              <p className="font-semibold text-zinc-100">#{selectedScene.number} {selectedScene.title}</p>
              <p className="text-zinc-400">Location: {selectedScene.location}</p>
              <p className="text-zinc-400">Time: {selectedScene.timeOfDay}</p>
              <p className="text-zinc-400">Status: {selectedScene.status}</p>
            </div>
            <div className="flex justify-end">
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditingScene(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}