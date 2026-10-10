import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FiFilm, FiUsers, FiUser, FiAlertTriangle, FiPlus, FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiVideo, FiClock, FiEdit2, FiDownload, FiTrash2 } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import { formatShortCurrency } from '../utils/format';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import AIRecommendations from '../components/ai/AIRecommendations';
import { fetchCrew } from '../api/crew';
import { createShootDay, deleteShootDay, fetchAllPages, fetchCast, fetchScenes, updateProjectDeadline, updateShootDay } from '../api/production';
import { getApiErrorMessage } from '../api/auth';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [deletingDeadlineId, setDeletingDeadlineId] = useState(null);
  const [deadlineForm, setDeadlineForm] = useState({ type: 'shoot-day', projectId: '', date: '', location: '' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllPages('/production/projects/'),
      fetchCrew(),
      fetchCast(),
      fetchScenes(),
      fetchAllPages('/production/shoot-days/'),
    ])
      .then(([projects, crew, cast, scenes, shootDays]) => {
        if (cancelled) return;
        setData({
          summary: {
            projects: projects.length,
            crew: crew.count,
            availableCrew: crew.results.filter((member) => member.available === true).length,
            busyCrew: crew.results.filter((member) => member.available === false).length,
            cast: cast.length,
            scenesToShoot: scenes.filter((scene) => ['Not Started', 'In Progress'].includes(scene.status)).length,
          },
          project: MOCK.projects[0],
          activity: MOCK.activity,
          risks: MOCK.ai.filter((item) => item.kind === 'risk'),
          budget: MOCK.budgetByDept,
          projects,
          shootDays,
          upcomingDeadlines: buildUpcomingDeadlines(projects, shootDays),
        });
      })
      .catch((error) => {
        if (!cancelled) {
          toast(getApiErrorMessage(error, 'Could not load live dashboard data.'), 'error');
          setData({
            summary: { ...MOCK.dashboard[0], scenesToShoot: 0 },
            project: MOCK.projects[0],
            activity: MOCK.activity,
            risks: MOCK.ai.filter((item) => item.kind === 'risk'),
            budget: MOCK.budgetByDept,
            projects: [],
            shootDays: [],
            upcomingDeadlines: [],
            overviewError: true,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="title" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
        </div>
      </div>
    );
  }

  const { summary, project, activity, risks, budget } = data;
  const spent = project.budgetSpent;
  const total = project.budgetTotal;
  const remaining = Math.max(total - spent, 0);
  const pct = Math.round((spent / total) * 100);
  const activeProject = data.projects.find((item) => item.title === project.title);
  const projectWrapDate = activeProject ? getProjectWrapDate(activeProject) : project.wrapDate;
  const donutData = [
    { name: 'Spent', value: spent, color: '#d13f4d' },
    { name: 'Remaining', value: remaining, color: '#27272a' },
  ];

  const openDeadlineEditor = (deadline = null) => {
    setEditingDeadline(deadline);
    setDeadlineForm(deadline ? {
      type: deadline.kind,
      projectId: String(deadline.projectId ?? ''),
      date: deadline.date,
      location: deadline.location ?? '',
    } : { type: 'shoot-day', projectId: '', date: '', location: '' });
    setDeadlineOpen(true);
  };

  const closeDeadlineEditor = () => {
    if (savingDeadline) return;
    setDeadlineOpen(false);
    setEditingDeadline(null);
  };

  const exportDeadlines = () => {
    const deadlines = buildUpcomingDeadlines(data.projects, data.shootDays, Infinity);
    if (!deadlines.length) {
      toast('There are no upcoming deadlines to export.', 'error');
      return;
    }

    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = deadlines.flatMap((deadline) => {
      const start = deadline.date.replaceAll('-', '');
      const endDate = new Date(`${deadline.date}T00:00:00`);
      endDate.setDate(endDate.getDate() + 1);
      const end = [
        endDate.getFullYear(),
        String(endDate.getMonth() + 1).padStart(2, '0'),
        String(endDate.getDate()).padStart(2, '0'),
      ].join('');
      const lines = [
        'BEGIN:VEVENT',
        `UID:${deadline.kind}-${deadline.id}@chuttee`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeCalendarText(deadline.title)}`,
        `DESCRIPTION:${escapeCalendarText(deadline.detail)}`,
      ];
      if (deadline.location) lines.push(`LOCATION:${escapeCalendarText(deadline.location)}`);
      lines.push('END:VEVENT');
      return lines;
    });
    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CHUTTEE//Production Deadlines//EN', ...events, 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chuttee-production-deadlines.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveDeadline = async (event) => {
    event.preventDefault();
    if (!deadlineForm.date) {
      toast('Choose a deadline date.', 'error');
      return;
    }
    if (deadlineForm.type === 'project-wrap' && !deadlineForm.projectId) {
      toast('Choose a project for the wrap deadline.', 'error');
      return;
    }
    setSavingDeadline(true);
    try {
      let projects = data.projects;
      let shootDays = data.shootDays;
      if (deadlineForm.type === 'project-wrap') {
        const project = projects.find((item) => String(item.id) === deadlineForm.projectId);
        if (!project) throw new Error('The selected project is no longer available.');
        await updateProjectDeadline({ id: project.id, endDate: deadlineForm.date });
        projects = projects.map((item) => item.id === project.id ? { ...item, end_date: deadlineForm.date } : item);
      } else {
        const dayNumber = editingDeadline?.kind === 'shoot-day'
          ? editingDeadline.dayNumber
          : Math.max(0, ...shootDays.map((day) => Number(day.day_number) || 0)) + 1;
        const values = {
          projectId: deadlineForm.projectId || null,
          shootDate: deadlineForm.date,
          dayNumber,
          location: deadlineForm.location.trim(),
        };
        const shootDay = editingDeadline?.kind === 'shoot-day'
          ? await updateShootDay({ ...values, id: editingDeadline.id })
          : await createShootDay(values);
        const savedShootDay = {
          ...shootDay,
          id: shootDay.id ?? shootDay.shoot_day_id ?? editingDeadline?.id,
          project: shootDay.project ?? values.projectId,
          shoot_date: shootDay.shoot_date ?? values.shootDate,
          day_number: shootDay.day_number ?? values.dayNumber,
          location: shootDay.location ?? values.location,
        };
        shootDays = editingDeadline?.kind === 'shoot-day'
          ? shootDays.map((day) => (day.id ?? day.shoot_day_id) === savedShootDay.id ? savedShootDay : day)
          : [...shootDays, savedShootDay];
      }
      setData((current) => ({
        ...current,
        projects,
        shootDays,
        upcomingDeadlines: buildUpcomingDeadlines(projects, shootDays),
      }));
      setDeadlineOpen(false);
      setEditingDeadline(null);
      toast(editingDeadline ? 'Deadline updated' : 'Deadline added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save deadline.'), 'error');
    } finally {
      setSavingDeadline(false);
    }
  };

  const deleteDeadline = async (deadline) => {
    const isShootDay = deadline.kind === 'shoot-day';
    const message = isShootDay
      ? `Delete ${deadline.title}? This removes the shoot-day schedule record.`
      : `Remove the wrap date for ${deadline.title}? The project itself will not be deleted.`;
    if (!window.confirm(message)) return;

    setDeletingDeadlineId(`${deadline.kind}-${deadline.id}`);
    try {
      let projects = data.projects;
      let shootDays = data.shootDays;
      if (isShootDay) {
        await deleteShootDay(deadline.id);
        shootDays = shootDays.filter((day) => (day.id ?? day.shoot_day_id) !== deadline.id);
      } else {
        await updateProjectDeadline({ id: deadline.projectId, endDate: null });
        projects = projects.map((item) => String(item.id) === String(deadline.projectId)
          ? { ...item, end_date: null, wrapDate: null }
          : item);
      }
      setData((current) => ({
        ...current,
        projects,
        shootDays,
        upcomingDeadlines: buildUpcomingDeadlines(projects, shootDays),
      }));
      toast(isShootDay ? 'Shoot day deleted' : 'Project wrap date removed', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not delete deadline.'), 'error');
    } finally {
      setDeletingDeadlineId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Dashboard</h1>
          <p className="text-sm text-zinc-400">Everything that matters, at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={FiUsers} onClick={() => navigate('/crew', { state: { openAdd: true } })}>Add Crew</Button>
          <Button variant="outline" size="sm" icon={FiVideo} onClick={() => navigate('/scenes', { state: { openAdd: true } })}>Add Scene</Button>
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => navigate('/budget', { state: { openAdd: true } })}>Log Expense</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiFilm} label="Projects" value={summary.projects} trend={12} color="brand" />
        <StatCard
          icon={FiUsers}
          label="Crew"
          value={summary.crew}
          detail={summary.availableCrew !== undefined ? `${summary.availableCrew} available · ${summary.busyCrew} busy` : undefined}
          trend={8}
          color="blue"
        />
        <StatCard icon={FiUser} label="Cast" value={summary.cast} trend={0} color="purple" />
        <StatCard icon={FiVideo} label="Scenes to shoot" value={summary.scenesToShoot} color="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{project.title}</h2>
                    <Badge variant="brand" icon={FiTrendingUp}>{project.status}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><FiUsers className="h-3.5 w-3.5" /> {project.crewCount} crew</span>
                    <span className="flex items-center gap-1"><FiUser className="h-3.5 w-3.5" /> {project.castCount} cast</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Completion</p>
                  <p className="text-2xl font-bold text-brand-400">{project.completion}%</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-1000" style={{ width: `${project.completion}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-zinc-800">
              <MiniStat label="Budget" value={formatShortCurrency(total)} icon={FiTrendingUp} />
              <MiniStat label="Spent" value={formatShortCurrency(spent)} icon={FiDollarSign} />
              <MiniStat label="Wrap" value={projectWrapDate} icon={FiCalendar} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Budget by Department" subtitle="Planned vs actual" icon={FiDollarSign} />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budget}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v / 100000}L`} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(v) => formatShortCurrency(v)} />
                    <Bar dataKey="budget" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" />
                    <Bar dataKey="actual" fill="#d13f4d" radius={[4, 4, 0, 0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent Activity" icon={FiActivity} />
            <CardBody className="p-0">
              <ul className="divide-y divide-zinc-800/60">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-brand-400">•</span>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-200">{a.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{a.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <AIRecommendations />

          <Card>
            <CardHeader
              title="Upcoming deadlines"
              subtitle="Shoot days and project wraps"
              icon={FiCalendar}
              action={(
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={FiDownload} disabled={data.overviewError} onClick={exportDeadlines}>Calendar</Button>
                  <Button variant="outline" size="sm" icon={FiPlus} disabled={data.overviewError} onClick={() => openDeadlineEditor()}>Add deadline</Button>
                </div>
              )}
            />
            <CardBody className="space-y-3">
              {data.overviewError ? (
                <p className="text-sm text-amber-300">Live schedule data is unavailable. These dashboard details may be sample data.</p>
              ) : data.upcomingDeadlines.length ? (
                data.upcomingDeadlines.map((deadline) => {
                  const daysUntil = getDaysUntil(deadline.date);
                  return (
                    <div key={`${deadline.type}-${deadline.date}-${deadline.title}`} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                        {daysUntil === 0 ? <FiClock className="h-4 w-4" /> : <FiCalendar className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-zinc-200">{deadline.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={daysUntil <= 3 ? 'warn' : 'info'}>{daysUntil === 0 ? 'Today' : `${daysUntil}d`}</Badge>
                            <button
                              type="button"
                              onClick={() => openDeadlineEditor(deadline)}
                              aria-label={`Edit ${deadline.title} deadline`}
                              title={`Edit ${deadline.title} deadline`}
                              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDeadline(deadline)}
                              disabled={deletingDeadlineId === `${deadline.kind}-${deadline.id}`}
                              aria-label={deadline.kind === 'shoot-day' ? `Delete ${deadline.title}` : `Remove ${deadline.title} wrap date`}
                              title={deadline.kind === 'shoot-day' ? 'Delete shoot day' : 'Remove wrap date'}
                              className="rounded-md p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{deadline.detail} · {formatDeadlineDate(deadline.date)}</p>
                      </div>

                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-500">No upcoming shoot days or project wrap dates.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Budget Used" icon={FiDollarSign} />
            <CardBody>
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={2} stroke="none">
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(v) => formatShortCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-brand-400">{pct}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">used</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-zinc-400">
                <span>{formatShortCurrency(spent)} spent</span>
                <span>{formatShortCurrency(remaining)} left</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Risk Alerts" icon={FiAlertTriangle} />
            <CardBody className="space-y-2">
              {risks.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <p className="text-xs text-zinc-300">{r.title}</p>
                  <Badge variant={r.severity === 'High' ? 'danger' : r.severity === 'Medium' ? 'warn' : 'info'}>{r.severity}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
      <Modal
        open={deadlineOpen}
        onClose={closeDeadlineEditor}
        title={editingDeadline ? 'Edit deadline' : 'Add deadline'}
        icon={FiCalendar}
        size="sm"
      >
        <form onSubmit={saveDeadline} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Deadline type
            <select
              value={deadlineForm.type}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, type: event.target.value }))}
              disabled={Boolean(editingDeadline)}
              className="input"
            >
              <option value="shoot-day">Shoot day</option>
              <option value="project-wrap">Project wrap</option>
            </select>
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Project
            <select
              value={deadlineForm.projectId}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, projectId: event.target.value }))}
              required={deadlineForm.type === 'project-wrap'}
              disabled={editingDeadline?.kind === 'project-wrap'}
              className="input"
            >
              <option value="">Unassigned</option>
              {data.projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <Input
            label="Date"
            type="date"
            value={deadlineForm.date}
            onChange={(event) => setDeadlineForm((form) => ({ ...form, date: event.target.value }))}
            required
          />
          {deadlineForm.type === 'shoot-day' && (
            <Input
              label="Location"
              value={deadlineForm.location}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, location: event.target.value }))}
              placeholder="Optional"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDeadlineEditor}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingDeadline}>
              {savingDeadline ? 'Saving…' : editingDeadline ? 'Save changes' : 'Add deadline'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function buildUpcomingDeadlines(projects, shootDays, limit = 5) {
  return [
    ...shootDays.map((shootDay) => {
      const projectId = shootDay.project ?? shootDay.project_id ?? '';
      const project = projects.find((item) => String(item.id) === String(projectId));
      return {
        id: shootDay.id ?? shootDay.shoot_day_id,
        kind: 'shoot-day',
        date: shootDay.shoot_date ?? shootDay.date,
        dayNumber: shootDay.day_number ?? shootDay.dayNumber,
        projectId,
        location: shootDay.location ?? '',
        title: `Shoot day ${shootDay.day_number ?? shootDay.dayNumber ?? ''}`.trim(),
        detail: [shootDay.location || 'Location not set', project?.title].filter(Boolean).join(' · '),
        type: 'Shoot day',
      };
    }),
    ...projects.map((project) => ({
      id: project.id,
      kind: 'project-wrap',
      date: getProjectWrapDate(project),
      projectId: project.id,
      title: project.title,
      detail: 'Project wrap',
      type: 'Project wrap',
    })),
  ]
    .filter((deadline) => deadline.date && getDaysUntil(deadline.date) >= 0)
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, limit);
}

function getProjectWrapDate(project) {
  if (!project) return null;
  return Object.prototype.hasOwnProperty.call(project, 'end_date') ? project.end_date : project.wrapDate;
}

function escapeCalendarText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function getDaysUntil(date) {
  const deadline = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function formatDeadlineDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatCard({ icon: Icon, label, value, detail, trend, color = 'brand' }) {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-500/15',
    blue: 'text-blue-400 bg-blue-500/15',
    purple: 'text-purple-400 bg-purple-500/15',
    red: 'text-red-400 bg-red-500/15',
  };
  return (
    <Card className="p-5 transition-transform hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {detail && <p className="mt-1 text-xs text-zinc-500">{detail}</p>}
          {trend !== undefined && trend !== 0 && (
            <div className={`mt-2 flex items-center gap-1 text-xs ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? <FiTrendingUp className="h-3 w-3" /> : <FiTrendingDown className="h-3 w-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">{Icon && <Icon className="h-3.5 w-3.5" />} {label}</div>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}