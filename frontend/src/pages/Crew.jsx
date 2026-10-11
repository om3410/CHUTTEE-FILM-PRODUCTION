import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router-dom';
import { FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api/auth';
import { DEPARTMENTS } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import { createCrewMember, deleteCrewMember, fetchCrew, updateCrewAvailability } from '../api/crew';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import ConfirmModal from '../components/feedback/ConfirmModal';
import BulkActionsBar from '../components/BulkActionsBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function Crew() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const {
    crewSearch: search,
    crewDepartment: department,
    crewAvailability: availability,
    setCrewDepartments,
  } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [crew, setCrew] = useState([]);
  const [updatingAvailability, setUpdatingAvailability] = useState([]);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [adding, setAdding] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: '', role: '', department: DEPARTMENTS[0], dailyRate: '' });

  useEffect(() => {
    if (location.state?.openAdd) setAddOpen(true);
  }, [location.key, location.state]);

  useEffect(() => {
    setCrewDepartments([...new Set([...DEPARTMENTS, ...crew.map((member) => member.department).filter(Boolean)])]
      .sort((first, second) => first.localeCompare(second)));
  }, [crew, setCrewDepartments]);

  useEffect(() => {
    let active = true;
    fetchCrew()
      .then(({ results }) => {
        if (active) setCrew(results);
      })
      .catch((error) => {
        if (active && error.response?.status !== 401) {
          toast(getApiErrorMessage(error, 'Unable to load crew members'), 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [toast]);

  const filtered = crew.filter((c) => {
    const q = search.trim().toLowerCase();
    const searchableValues = [c.name, c.role, c.department, c.email, ...(Array.isArray(c.skills) ? c.skills : [])];
    const matchesSearch = !q || searchableValues.some((value) => String(value ?? '').toLowerCase().includes(q));
    const matchesDept = !department || c.department === department;
    const matchesAvailability = !availability || (availability === 'available' ? c.available === true : c.available === false);
    return matchesSearch && matchesDept && matchesAvailability;
  });
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const canManageAvailability = user?.is_superuser || ['CREW', 'ADMIN'].includes(user?.role);
  const changeAvailability = async (member) => {
    if (updatingAvailability.includes(member.id)) return;
    setUpdatingAvailability((list) => [...list, member.id]);
    try {
      const updated = await updateCrewAvailability(member.id, member.available !== true);
      setCrew((list) => list.map((item) => item.id === updated.id ? updated : item));
      toast(`${updated.name} marked ${updated.available ? 'available' : 'busy'}`, 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to update crew availability'), 'error');
    } finally {
      setUpdatingAvailability((list) => list.filter((id) => id !== member.id));
    }
  };
  const remove = async (id) => {
    try {
      await deleteCrewMember(id);
      setCrew((list) => list.filter((c) => c.id !== id));
      setSelected((s) => s.filter((x) => x !== id));
      toast('Crew member removed', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to remove crew member'), 'error');
    }
  };
  const addCrew = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const member = await createCrewMember(newCrew);
      setCrew((list) => [...list, member]);
      setNewCrew({ name: '', role: '', department: DEPARTMENTS[0], dailyRate: '' });
      setAddOpen(false);
      toast('Crew member added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to add crew member'), 'error');
    } finally {
      setAdding(false);
    }
  };
  const removeSelected = async () => {
    const results = await Promise.allSettled(selected.map(deleteCrewMember));
    const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
    if (deletedIds.length) {
      setCrew((list) => list.filter((member) => !deletedIds.includes(member.id)));
      setSelected((list) => list.filter((id) => !deletedIds.includes(id)));
      toast(`Removed ${deletedIds.length} members`, 'success');
    }
    if (deletedIds.length < selected.length) {
      toast('Some crew members could not be removed', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crew</h1>
          <p className="text-sm text-zinc-400">{filtered.length} of {crew.length} members</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setAddOpen(true)}>Add Crew</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FiUsers} title="No crew found" description="Try adjusting your filters, or add a new member." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="group relative p-5 transition-all hover:border-brand-500/40 hover:scale-[1.02]">
                <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} className="absolute left-3 top-3 h-4 w-4 rounded border-zinc-700 bg-zinc-900 opacity-0 transition-opacity group-hover:opacity-100 checked:opacity-100" />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} ring />
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.role}</p>
                    </div>
                  </div>
                  {canManageAvailability ? (
                    <button
                      type="button"
                      onClick={() => changeAvailability(m)}
                      disabled={updatingAvailability.includes(m.id)}
                      aria-label={`Mark ${m.name} ${m.available ? 'busy' : 'available'}`}
                      className="rounded-full disabled:cursor-wait disabled:opacity-60"
                    >
                      <Badge variant={m.available ? 'success' : 'default'}>
                        {updatingAvailability.includes(m.id) ? 'Saving…' : m.available ? 'Available · click to mark busy' : 'Busy · click to mark available'}
                      </Badge>
                    </button>
                  ) : (
                    <Badge variant={m.available ? 'success' : 'default'}>{m.available ? 'Available' : 'Busy'}</Badge>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.skills?.map((s) => <span key={s} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>)}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                  <span>{formatCurrency(m.dailyRate)}/day</span>
                  <button onClick={() => setConfirm(m.id)} className="flex items-center gap-1 text-red-400 opacity-0 group-hover:opacity-100"><FiTrash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <BulkActionsBar
        count={selected.length}
        onClear={() => setSelected([])}
        onDelete={removeSelected}
      />

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm)} title="Remove crew member" message="This action cannot be undone. Are you sure?" confirmLabel="Delete" />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Crew Member" icon={FiUsers} size="sm">
        <form onSubmit={addCrew} className="space-y-4">
          <Input label="Name" value={newCrew.name} onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })} required />
          <Input label="Role" value={newCrew.role} onChange={(e) => setNewCrew({ ...newCrew, role: e.target.value })} required />
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Department
            <select value={newCrew.department} onChange={(e) => setNewCrew({ ...newCrew, department: e.target.value })} className="input w-full">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <Input label="Daily Rate" type="number" min="0" step="1" value={newCrew.dailyRate} onChange={(e) => setNewCrew({ ...newCrew, dailyRate: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={adding}>Add Crew</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}