import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  FiPlus, FiTrash2, FiUsers, FiArrowRight, FiSearch,
  FiFilm, FiCamera, FiMic, FiEdit3, FiMonitor, FiMusic,
  FiCheckCircle, FiHelpCircle, FiInbox, FiX,
} from 'react-icons/fi';
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
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';

export default function Crew() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    crewSearch: search = '',
    crewDepartment: department = '',
    crewAvailability: availability = '',
    setCrewSearch = () => {},
    setCrewDepartment = () => {},
    setCrewAvailability = () => {},
    setCrewDepartments = () => {},
  } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [crew, setCrew] = useState([]);
  const [updatingAvailability, setUpdatingAvailability] = useState([]);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [adding, setAdding] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: '', role: '', department: DEPARTMENTS[0], dailyRate: '' });

  /* ─────────────── Filter helpers — use context setters ─────────────── */
  const clearAllFilters = () => {
    setCrewSearch('');
    setCrewDepartment('');
    setCrewAvailability('');
  };
  const scrollToRoster = () => {
    setTimeout(() => {
      document.getElementById('crew-roster')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const applyDepartment = (value) => {
    setCrewDepartment(value);
    scrollToRoster();
  };
  const hasActiveFilters = Boolean(search || department || availability);

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

  const availableCount = crew.filter((m) => m.available === true).length;
  const busyCount = crew.filter((m) => m.available === false).length;
  const uniqueDepartments = [...new Set(crew.map((m) => m.department).filter(Boolean))].length;

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
    } finally {
      setConfirm(null);
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

  const roleRoutes = [
    { number: '01', icon: FiFilm,    eyebrow: 'Direction',         title: 'Directors & ADs',          description: 'Directors, first ADs, second ADs, script supervisors and continuity.',   filter: 'Direction' },
    { number: '02', icon: FiCamera,  eyebrow: 'Camera & Lighting', title: 'DOPs & Gaffers',           description: 'Cinematographers, focus pullers, gaffers, grips and camera assistants.', filter: 'Camera' },
    { number: '03', icon: FiMic,     eyebrow: 'Sound',             title: 'Recordists & Mixers',      description: 'Location recordists, boom operators, sound designers and mixers.',        filter: 'Sound' },
    { number: '04', icon: FiEdit3,   eyebrow: 'Post-Production',   title: 'Editors & Colourists',     description: 'Editors, assistant editors, colourists, VFX artists and sound designers.', filter: 'Post' },
    { number: '05', icon: FiMonitor, eyebrow: 'VFX & Animation',   title: 'Compositors & CG Artists', description: 'Compositing, rotoscoping, CG, motion graphics and animation talent.',     filter: 'VFX' },
    { number: '06', icon: FiMusic,   eyebrow: 'Music & Score',     title: 'Composers & Playback',     description: 'Composers, lyricists, playback singers, music supervisors and mixers.',   filter: 'Music' },
  ];

  const departmentCount = (dept) => crew.filter((m) => m.department === dept).length;

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The People Behind the Frame"
        title="Every Story Needs a Team."
        subtitle="Every Frame Needs Craft."
        lead="Discover directors, cinematographers, editors, designers and technicians. Review rate cards and availability. Assign to scenes and shoot days. Build the crew that brings your vision to life — department by department, role by role, shot by shot."
        slogan="Every crew member has a story. Every role has a purpose. The right team, the right timing, the right craft can turn a production into a legacy that outlasts the work itself."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Right Team</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Role You Need.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by name, role, department, email or skill. Filter by availability. Find the person who fits the shot.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setCrewSearch(e.target.value)}
                placeholder="Name, role, skill…"
                className="input pl-10"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Department</span>
            <select
              value={department}
              onChange={(e) => applyDepartment(e.target.value)}
              className="input"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Availability</span>
            <select
              value={availability}
              onChange={(e) => setCrewAvailability(e.target.value)}
              className="input"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setAddOpen(true)} className="w-full">
              Add Crew Member
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              Showing {filtered.length} of {crew.length} crew
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400"
            >
              <FiX className="h-3 w-3" /> Clear filters
            </button>
          </div>
        )}
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={crew.length} label="Total crew" note="Across all departments" />
        <StatNumber value={availableCount} label="Available now" note="Ready for shoot days" />
        <StatNumber value={busyCount} label="Currently busy" note="On active productions" />
        <StatNumber value={uniqueDepartments} label="Departments" note="Roles represented" />
      </section>

      {/* 4. QUOTE */}
      <Quote>
        "A film is never made by one person. It is made by a hundred — each one carrying a piece of the vision the director cannot hold alone."
      </Quote>

      {/* 5. SIX ROLE ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Role Are You Hiring For?
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Some start with the department. Others start with the exact role. Every crew member fits somewhere.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roleRoutes.map(({ number, icon: Icon, eyebrow, title, description, filter }) => (
            <RouteCard
              key={number}
              number={number}
              icon={Icon}
              eyebrow={eyebrow}
              title={title}
              description={description}
              count={departmentCount(filter)}
              isActive={department === filter}
              action={department === filter ? 'Clear filter' : 'View crew →'}
              onAction={() => {
                if (department === filter) {
                  setCrewDepartment('');
                } else {
                  setCrewDepartment(filter);
                  scrollToRoster();
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* 6. QUOTE */}
      <Quote>
        "A crew list is not a directory. It is a map of the people who can turn a script into a story — one shoot day at a time."
      </Quote>

      {/* 7. DEPARTMENT CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Department</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Search the Way Producers Actually Think.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every role belongs to a department. Choose the one you need, and CHUTTEE surfaces the right people.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DEPARTMENTS.slice(0, 8).map((dept) => (
            <DepartmentChip
              key={dept}
              label={dept}
              sub={`${departmentCount(dept)} crew available`}
              isActive={department === dept}
              onClick={() => {
                if (department === dept) {
                  setCrewDepartment('');
                } else {
                  setCrewDepartment(dept);
                  scrollToRoster();
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* 8. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Clarity. A Crew Wants Work.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person building the team, one for the person on set.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Showrunners"
            steps={['Discover', 'Vet', 'Book', 'Assign', 'Track', 'Pay']}
            description="Find the right crew across every department. Review rates and availability. Assign to scenes and shoot days. Track attendance and payouts."
            onStepClick={(step) => {
              if (step === 'Discover' || step === 'Vet' || step === 'Book') scrollToRoster();
              if (step === 'Assign') navigate('/scenes');
              if (step === 'Track') navigate('/activity');
              if (step === 'Pay') navigate('/billing');
            }}
          />
          <JourneyCard
            title="For Crew & Technicians"
            steps={['Profile', 'Apply', 'Confirm', 'Shoot', 'Log', 'Payment']}
            description="Build a profile that shows your craft. Discover productions that match your skill. Confirm shoot days and log attendance. Get paid on time."
            onStepClick={(step) => {
              if (step === 'Profile' || step === 'Apply') navigate('/settings');
              if (step === 'Confirm' || step === 'Shoot') navigate('/scenes');
              if (step === 'Log') navigate('/activity');
              if (step === 'Payment') navigate('/billing');
            }}
          />
        </div>
      </section>

      {/* 9. QUOTE */}
      <Quote>
        "The best crews are not the largest. They are the ones where every person knows exactly why they are there — and what their work makes possible."
      </Quote>

      {/* 10. MAIN CREW GRID */}
      <section id="crew-roster" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Roster</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Your Team, in One Place.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filtered.length} of {crew.length} crew members shown{department && ` — filtered by ${department}`}.
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="No crew found"
              description="Try adjusting your filters, or add a new member."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="group relative p-5 transition-all hover:border-gold-500/40 hover:scale-[1.02]">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggle(m.id)}
                      className="absolute left-3 top-3 h-4 w-4 rounded border-zinc-700 bg-zinc-900 opacity-0 transition-opacity group-hover:opacity-100 checked:opacity-100"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} ring />
                        <div>
                          <p className="font-serif text-base font-semibold text-zinc-100">{m.name}</p>
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
                            {updatingAvailability.includes(m.id) ? 'Saving…' : m.available ? 'Available' : 'Busy'}
                          </Badge>
                        </button>
                      ) : (
                        <Badge variant={m.available ? 'success' : 'default'}>{m.available ? 'Available' : 'Busy'}</Badge>
                      )}
                    </div>

                    {m.department && (
                      <button
                        type="button"
                        onClick={() => setCrewDepartment(m.department)}
                        className="mt-3 text-[10px] uppercase tracking-[0.2em] text-gold-400 transition-colors hover:text-gold-300"
                      >
                        {m.department} →
                      </button>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.skills?.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>
                      ))}
                    </div>

                    <div className="gold-divider my-4" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif text-base font-bold text-gold-gradient">
                        {formatCurrency(m.dailyRate)}<span className="text-zinc-500 text-xs font-normal">/day</span>
                      </span>
                      <button
                        onClick={() => setConfirm(m.id)}
                        className="flex items-center gap-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Delete ${m.name}`}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 11. QUOTE */}
      <Quote>
        "Every crew member is a specialist in their own craft. The production is what happens when those crafts meet in the same frame."
      </Quote>

      {/* 12. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Build Your Team?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Person You Need Most.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiPlus}
            title="Add Crew"
            description="Bring a new technician or creative into your roster."
            onAction={() => setAddOpen(true)}
          />
          <QuickAction
            icon={FiUsers}
            title="View All Departments"
            description="Browse every role in the CHUTTEE production system."
            onAction={() => {
              clearAllFilters();
              scrollToRoster();
            }}
          />
          <QuickAction
            icon={FiCheckCircle}
            title="Assign to a Shoot Day"
            description="Link a crew member to a scene and shoot day."
            onAction={() => navigate('/scenes', { state: { assignCrew: true } })}
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
              Looking for a Specific Role? Tell Us What You Need.
            </h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:crew@chuttee.in" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">crew@chuttee.in</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+919876543210" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our production desk for crew sourcing and scheduling.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      <BulkActionsBar
        count={selected.length}
        onClear={() => setSelected([])}
        onDelete={removeSelected}
      />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm)}
        title="Remove crew member"
        message="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
      />

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

function DepartmentChip({ label, sub, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`premium-card group flex items-start gap-3 p-4 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        <FiUsers className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-serif text-base font-semibold text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
      </div>
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