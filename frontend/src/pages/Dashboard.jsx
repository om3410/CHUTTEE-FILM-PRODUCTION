import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  FiFilm, FiUsers, FiUser, FiAlertTriangle, FiPlus, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiVideo,
  FiClock, FiEdit2, FiDownload, FiTrash2, FiCpu, FiFileText,
  FiMessageSquare, FiLayers, FiZap, FiArrowRight, FiSearch,
  FiInbox, FiHelpCircle
} from 'react-icons/fi';
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
import PageHero from '../components/ui/PageHero';
import { useAuth } from '../context/AuthContext';

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
  const [searchFilters, setSearchFilters] = useState({
    projectId: '',
    department: '',
    budget: '',
    status: '',
  });
  const { user } = useAuth();

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

  // Option lists for the search strip
  const projectOptions = useMemo(() => {
    if (!data?.projects) return [];
    return data.projects.map((p) => ({ value: String(p.id), label: p.title }));
  }, [data?.projects]);

  const statusOptions = useMemo(() => {
    if (!data?.projects) return [];
    const set = new Set(data.projects.map((p) => p.status).filter(Boolean));
    return Array.from(set).map((s) => ({ value: s, label: s }));
  }, [data?.projects]);

  const budgetOptions = [
    { value: '', label: 'Any budget' },
    { value: 'under-10l', label: 'Under Rs. 10 Lakh' },
    { value: '10l-50l', label: 'Rs. 10 Lakh - Rs. 50 Lakh' },
    { value: '50l-1cr', label: 'Rs. 50 Lakh - Rs. 1 Crore' },
    { value: '1cr-plus', label: 'Rs. 1 Crore +' },
  ];

  const departmentOptions = [
    { value: '', label: 'All departments' },
    { value: 'direction', label: 'Direction' },
    { value: 'camera', label: 'Camera' },
    { value: 'sound', label: 'Sound' },
    { value: 'art', label: 'Art & Design' },
    { value: 'post', label: 'Post' },
    { value: 'vfx', label: 'VFX' },
    { value: 'music', label: 'Music' },
    { value: 'production', label: 'Production' },
  ];

  const handleSearch = () => {
    navigate('/scenes', { state: { filters: searchFilters } });
  };

  // Filter projects by search criteria — MUST stay above `if (loading)` for hook ordering
  const filteredProjects = useMemo(() => {
    const list = data?.projects ?? [];
    return list.filter((p) => {
      const b = Number(p.budget_total ?? p.budgetTotal ?? 0);
      if (searchFilters.budget === 'under-10l' && b >= 1000000) return false;
      if (searchFilters.budget === '10l-50l' && (b < 1000000 || b >= 5000000)) return false;
      if (searchFilters.budget === '50l-1cr' && (b < 5000000 || b >= 10000000)) return false;
      if (searchFilters.budget === '1cr-plus' && b < 10000000) return false;
      if (searchFilters.status && p.status !== searchFilters.status) return false;
      if (searchFilters.projectId && String(p.id) !== String(searchFilters.projectId)) return false;
      return true;
    });
  }, [data?.projects, searchFilters]);

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

  if (!data) {
    return null;
  }

  const { summary, project: defaultProject, activity, risks, budget } = data;

  // The active (filtered) project — falls back to the mock project only if nothing else exists
  const activeProject =
    filteredProjects.find((item) => item.title === defaultProject.title) ??
    filteredProjects[0] ??
    data?.projects?.find((item) => item.title === defaultProject.title) ??
    data?.projects?.[0];

  // Merge the API project into the shape the featured card expects, keeping mock defaults
  const project = activeProject
    ? {
        ...defaultProject,
        ...activeProject,
        budgetTotal: Number(activeProject.total_budget ?? activeProject.budgetTotal ?? 0),
        budgetSpent: Number(
          activeProject.budget_spent ?? activeProject.budgetSpent ?? defaultProject?.budgetSpent ?? 0
        ),
        crewCount: summary?.crew ?? defaultProject?.crewCount ?? 0,
        castCount: summary?.cast ?? defaultProject?.castCount ?? 0,
        completion: activeProject.completion ?? defaultProject?.completion ?? 0,
        wrapDate: activeProject.end_date ?? activeProject.wrapDate ?? defaultProject?.wrapDate,
        startDate: activeProject.start_date ?? activeProject.startDate ?? defaultProject?.startDate,
      }
    : defaultProject;

  const spent = project.budgetSpent ?? 0;
  const total = project.budgetTotal ?? 0;
  const remaining = Math.max(total - spent, 0);
  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
  const projectWrapDate = getProjectWrapDate(activeProject) ?? project.wrapDate ?? '-';
  const donutData = [
    { name: 'Spent', value: spent, color: '#d4af37' },
    { name: 'Remaining', value: remaining, color: '#27272a' },
  ];
  const hasMatches = filteredProjects.length > 0;

  const openDeadlineEditor = (deadline = null) => {
    setEditingDeadline(deadline);
    setDeadlineForm(deadline ? {
      type: deadline.kind,
      projectId: deadline.projectId != null ? String(deadline.projectId) : '',
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
    const wasEditing = Boolean(editingDeadline);
    try {
      let projects = data.projects;
      let shootDays = data.shootDays;
      if (deadlineForm.type === 'project-wrap') {
        const wrapProject = projects.find((item) => String(item.id) === deadlineForm.projectId);
        if (!wrapProject) throw new Error('The selected project is no longer available.');
        await updateProjectDeadline({ id: wrapProject.id, endDate: deadlineForm.date });
        projects = projects.map((item) => item.id === wrapProject.id ? { ...item, end_date: deadlineForm.date } : item);
      } else {
        const dayNumber = editingDeadline?.kind === 'shoot-day'
          ? Number(editingDeadline.dayNumber)
          : Math.max(0, ...shootDays.map((day) => Number(day.day_number) || 0)) + 1;
        const values = {
          projectId: deadlineForm.projectId ? Number(deadlineForm.projectId) : null,
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
      toast(wasEditing ? 'Deadline updated' : 'Deadline added', 'success');
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
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The Cinema Studio, Creative Operations & Production Intelligence Hub"
        title="Where Stories Take Shape."
        subtitle="Where Visions Become Reality."
        lead="Oversee every production from a single command centre. Track crew availability, cast schedules and rate cards in real time. Manage scene breakdowns, shoot days, locations and equipment. Monitor budgets down to the last rupee - planned versus actual, by department. Coordinate post-production, VFX, music and release. Turn raw footage into finished films with clarity, confidence and complete visibility at every step of the journey."
        slogan="Every story deserves care. Every frame deserves intention. Every production deserves a team that sees the whole picture - from the first spark of an idea to the final cut that reaches the world. The right planning, the right people, the right tools can turn a vision into a legacy that outlasts us all."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find What You Need</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with What You Are Looking For.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search productions by crew, cast, location, department, budget or status. Or jump straight into the section you need.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchField
            id="dash-filter-project"
            name="dash-filter-project"
            label="Productions"
            value={searchFilters.projectId}
            onChange={(value) => setSearchFilters((f) => ({ ...f, projectId: value }))}
            options={projectOptions}
            placeholder="All productions"
          />
          <SearchField
            id="dash-filter-department"
            name="dash-filter-department"
            label="Department"
            value={searchFilters.department}
            onChange={(value) => setSearchFilters((f) => ({ ...f, department: value }))}
            options={departmentOptions}
            placeholder="All departments"
          />
          <SearchField
            id="dash-filter-budget"
            name="dash-filter-budget"
            label="Budget Range"
            value={searchFilters.budget}
            onChange={(value) => setSearchFilters((f) => ({ ...f, budget: value }))}
            options={budgetOptions}
            placeholder="Any budget"
          />
          <SearchField
            id="dash-filter-status"
            name="dash-filter-status"
            label="Status"
            value={searchFilters.status}
            onChange={(value) => setSearchFilters((f) => ({ ...f, status: value }))}
            options={statusOptions}
            placeholder="All statuses"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiSearch} onClick={handleSearch}>Search Productions</Button>
          <Button variant="outline" size="sm" icon={FiFilm} onClick={() => navigate('/scenes')}>View All Projects</Button>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Connected to {summary.projects} active productions - {summary.crew} crew members - {summary.cast} cast attached.
        </p>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={summary.projects} label="Active productions" note="Currently in pipeline" />
        <StatNumber value={summary.crew} label="Crew & technicians" note={`${summary.availableCrew} available now`} />
        <StatNumber value={summary.cast} label="Cast & talent" note="Attached to productions" />
        <StatNumber value={summary.scenesToShoot} label="Scenes to shoot" note="Awaiting principal photography" />
      </section>

      {/* 4. QUOTE */}
      <Quote>
        "A production is not a schedule. It is a promise - to the story, to the crew, to the audience. The right tools keep that promise alive."
      </Quote>

      {/* 5. AI STUDIO */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">New Intelligence Tools</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Your Scripts & Data, Analysed by AI.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            We've added machine learning endpoints directly into your production pipeline. Analyse sentiment, detect mood, summarise screenplays, and query your database using plain English.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AIFeatureCard
            icon={FiMessageSquare}
            title="Script Analysis"
            description="Detect sentiment, emotion and pacing in your dialogue."
            action="Analyse Now"
            onAction={() => navigate('/ai', { state: { tab: 'analyze' } })}
          />
          <AIFeatureCard
            icon={FiFileText}
            title="Summarise Screenplay"
            description="Get a tight summary of a full script or a specific scene."
            action="Summarise"
            onAction={() => navigate('/ai', { state: { tab: 'summarize' } })}
          />
          <AIFeatureCard
            icon={FiLayers}
            title="Mood Classifier"
            description="Instantly detect the genre and mood of your story."
            action="Classify Mood"
            onAction={() => navigate('/ai', { state: { tab: 'mood' } })}
          />
          <AIFeatureCard
            icon={FiZap}
            title="Ask Your Database"
            description="Query projects, budgets and crew in plain English."
            action="Ask AI"
            onAction={() => navigate('/ai', { state: { tab: 'query' } })}
          />
        </div>
      </section>

      {/* 6. WHERE CHUTTEE CAN HELP YOU */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Brings You Here Today?
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Whether you are producing a feature, managing a documentary or building a series - start with the piece you need most.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouteCard
            number="01"
            eyebrow="Crew & Cast"
            title="Build the Team Behind the Story."
            description="Discover directors, cinematographers, editors, designers and talent. Review rate cards, availability and past work."
            action="Manage Crew ->"
            onAction={() => navigate('/crew')}
          />
          <RouteCard
            number="02"
            eyebrow="Scenes & Production"
            title="Move Every Scene Toward the Screen."
            description="Track development through release. Manage pre-production, casting, shooting and post. See the pipeline at a glance."
            action="Open Scenes ->"
            onAction={() => navigate('/scenes')}
          />
          <RouteCard
            number="03"
            eyebrow="Budget & Billing"
            title="Every Rupee, on the Record."
            description="Compare planned versus actual spend by department. Track expenses with receipts. Generate GST-ready invoices."
            action="View Budget ->"
            onAction={() => navigate('/budget')}
          />
          <RouteCard
            number="04"
            eyebrow="Film Assets"
            title="Preserve the Visual Memory."
            description="Upload posters, stills, BTS shots and references. Organize by project. Resize, convert and download on demand."
            action="Open Assets ->"
            onAction={() => navigate('/assets')}
          />
          <RouteCard
            number="05"
            eyebrow="AI Insights"
            title="See Problems Before They Cost You."
            description="Get plain-language alerts about schedule risk, budget overruns and crew conflicts before they affect your shoot."
            action="View Insights ->"
            onAction={() => navigate('/ai')}
          />
          <RouteCard
            number="06"
            eyebrow="Activity & Inbox"
            title="Keep Every Voice in the Loop."
            description="Track who changed what and when. Receive notes, approvals and comments. Reply, tag and resolve in context."
            action="Open Inbox ->"
            onAction={() => navigate('/inbox')}
          />
        </div>
      </section>

      {/* 7. QUOTE */}
      <Quote>
        "An auction may be one route to value. CHUTTEE is built around a wider question: what is the right next move for the story?"
      </Quote>

      {/* 8. DEPARTMENT CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Department</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Search the Way Filmmakers Actually Think.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Some start with the role. Many start with the department. Every crew member belongs to one.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DepartmentChip label="Direction" sub="Directors, ADs, script supervisors" />
          <DepartmentChip label="Camera" sub="DOP, focus, gaffer, grip" />
          <DepartmentChip label="Sound" sub="Recordists, boom, mixers" />
          <DepartmentChip label="Art & Design" sub="Production design, costume, props" />
          <DepartmentChip label="Post" sub="Editors, colourists, sound designers" />
          <DepartmentChip label="VFX" sub="Compositors, roto, CG artists" />
          <DepartmentChip label="Music" sub="Composers, lyricists, playback" />
          <DepartmentChip label="Production" sub="Producers, line producers, managers" />
        </div>
      </section>

      {/* 9. PRODUCTION PIPELINE */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Production Pipeline</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            One Studio. Every Stage of Production.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            From the first spark of development to the day the film reaches the world - every stage has a home in CHUTTEE.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StageChip number="01" label="Development" note="Script, concept, financing" />
          <StageChip number="02" label="Pre-Production" note="Scheduling, budgeting, planning" />
          <StageChip number="03" label="Casting" note="Auditions, callbacks, talent lock" />
          <StageChip number="04" label="Shooting" note="Principal photography" active />
          <StageChip number="05" label="Post-Production" note="Edit, colour, sound" />
          <StageChip number="06" label="VFX" note="Compositing, CG, cleanup" />
          <StageChip number="07" label="Music" note="Score, mix, playback" />
          <StageChip number="08" label="Release" note="Delivery, distribution" />
        </div>
      </section>

      {/* 10. BUILT FOR BOTH SIDES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Clarity. A Crew Wants Work.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys - one for the person running the production, one for the person on set.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Showrunners"
            steps={['Onboard', 'Plan', 'Budget', 'Schedule', 'Shoot', 'Deliver']}
            description="Structure the production. Manage departments and budgets. Reach the right crew. Track every scene from script to screen."
          />
          <JourneyCard
            title="For Crew & Cast"
            steps={['Profile', 'Discover', 'Apply', 'Confirm', 'Shoot', 'Payment']}
            description="Build your profile. Discover work that matches your skill. Confirm availability. Track shoot days and payments."
          />
        </div>
      </section>

      {/* 11. QUOTE */}
      <Quote>
        "A schedule tells you what is being shot. Understanding tells you whether the story deserves your time."
      </Quote>

      {/* 12. ACTIVE PRODUCTION */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Live Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Story You Are Telling.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            A live snapshot of your featured production - progress, budget, team and schedule, all in one place.
          </p>
        </div>

        <div className="mt-8">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-2xl font-bold">{project.title}</h3>
                    <Badge variant="brand" icon={FiTrendingUp}>{project.status}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5"><FiUsers className="h-3.5 w-3.5" /> {project.crewCount} crew</span>
                    <span className="flex items-center gap-1.5"><FiUser className="h-3.5 w-3.5" /> {project.castCount} cast</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Completion</p>
                  <p className="mt-1 font-serif text-3xl font-bold text-gold-gradient">{project.completion}%</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-1000" style={{ width: `${project.completion}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-zinc-800">
              <MiniStat label="Budget" value={formatShortCurrency(total)} icon={FiTrendingUp} />
              <MiniStat label="Spent" value={formatShortCurrency(spent)} icon={FiDollarSign} />
              <MiniStat label="Wrap" value={projectWrapDate} icon={FiCalendar} />
            </div>
          </Card>
        </div>
      </section>

      {/* 13. MONEY & METRICS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Money & Metrics</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            See Where the Money Goes.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Planned versus actual spend across every department - the numbers that keep a production honest.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Budget by Department" subtitle="Planned vs actual" icon={FiDollarSign} />
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budget}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v / 100000}L`} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(v) => formatShortCurrency(v)} isAnimationActive={false} />
                    <Bar dataKey="budget" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" isAnimationActive={false} />
                    <Bar dataKey="actual" fill="#d4af37" radius={[4, 4, 0, 0]} name="Actual" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Budget Used" icon={FiDollarSign} />
            <CardBody>
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={65} outerRadius={90} paddingAngle={2} stroke="none" isAnimationActive={false}>
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} formatter={(v) => formatShortCurrency(v)} isAnimationActive={false} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-serif text-3xl font-bold text-gold-gradient">{pct}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">used</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-zinc-400">
                <span>{formatShortCurrency(spent)} spent</span>
                <span>{formatShortCurrency(remaining)} left</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 14. TIME-SENSITIVE THIS WEEK */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Time-Sensitive This Week</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Closing Soon. Acting Now.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Deadlines whose shoot days, wrap dates or approvals are approaching - without artificial countdowns.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UrgencyCard
            label="Shoot days this week"
            value={data.upcomingDeadlines.filter((d) => d.kind === 'shoot-day').length}
            note="Crew confirmed and locations set"
            action="View schedule"
            onAction={() => navigate('/scenes')}
          />
          <UrgencyCard
            label="Project wraps"
            value={data.upcomingDeadlines.filter((d) => d.kind === 'project-wrap').length}
            note="Final delivery dates approaching"
            action="View productions"
            onAction={() => navigate('/scenes')}
          />
          <UrgencyCard
            label="Open risk alerts"
            value={risks.length}
            note="Budget, schedule, resource conflicts"
            action="View insights"
            onAction={() => navigate('/ai')}
          />
        </div>
      </section>

      {/* 15. SCHEDULE + RISKS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Schedule & Signals</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Needs Your Attention This Week.
          </h2>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
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
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
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
                              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-gold-400"
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
                        <p className="mt-1 text-xs text-zinc-500">{deadline.detail} - {formatDeadlineDate(deadline.date)}</p>
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
            <CardHeader title="Risk Alerts" icon={FiAlertTriangle} />
            <CardBody className="space-y-2">
              {risks.length ? risks.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <p className="text-xs text-zinc-300">{r.title}</p>
                  <Badge variant={r.severity === 'High' ? 'danger' : r.severity === 'Medium' ? 'warn' : 'info'}>{r.severity}</Badge>
                </div>
              )) : (
                <p className="text-sm text-zinc-500">No risk alerts this week.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 16. ACTIVITY + AI */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Intelligence & Timeline</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            The Story Behind the Story.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Live activity, AI recommendations and the narrative of every change across your productions.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Recent Activity" icon={FiActivity} />
            <CardBody className="p-0">
              <ul className="divide-y divide-zinc-800/60">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 font-serif text-xs font-bold text-gold-400">
                      {a.message?.[0]?.toUpperCase() || '-'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-200">{a.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">{a.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <div>
            <AIRecommendations />
          </div>
        </div>
      </section>

      {/* 17. WHY CHUTTEE */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Why CHUTTEE</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            The Market Has Information. What It Often Lacks Is Connection.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE is built to connect productions, crews, budgets and stories - without pretending one platform replaces judgement, craft or the people on set.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PrincipleCard
            title="Craft Over Noise"
            description="More listings, more alerts, more dashboards do not automatically create better films. We focus on the signals that matter."
          />
          <PrincipleCard
            title="Clarity Before Commitment"
            description="A schedule alone should never drive a shoot day. Crew, budget, location and cast must all line up."
          />
          <PrincipleCard
            title="Relevant Reach Over Mere Visibility"
            description="For producers, the goal is reaching the people capable of delivering the work - not simply more people."
          />
          <PrincipleCard
            title="Human Judgement Remains Central"
            description="Software can reduce friction and organise information. The creative decision remains with the filmmaker."
          />
        </div>
      </section>

      {/* 18. QUOTE */}
      <Quote>
        "The films that endure are not the ones with the fewest problems. They are the ones where the people behind them saw the problems early - and solved them together."
      </Quote>

      {/* 19. CTA */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Shoot?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Tell Us What You Want to Create Next.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Add a crew member, log an expense, or plan the next shoot day - start with the piece you need most right now.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiUsers}
            title="Add Crew"
            description="Bring a new team member into an active production."
            onAction={() => navigate('/crew', { state: { openAdd: true } })}
          />
          <QuickAction
            icon={FiVideo}
            title="Add Scene"
            description="Log a new scene, its cast and its shoot day."
            onAction={() => navigate('/scenes', { state: { openAdd: true } })}
          />
          <QuickAction
            icon={FiCpu}
            title="Ask AI"
            description="Query your database or analyse a script instantly."
            onAction={() => navigate('/ai')}
          />
        </div>
      </section>

      {/* 20. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">
              Tell Us What You Are Trying to Find, Shoot, Finish or Take Forward.
            </h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <p className="mt-2 text-sm text-zinc-300">omrewaskar4@gmail.com</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <p className="mt-2 text-sm text-zinc-300">+91 74101 11497</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Office</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Mumbai, Maharashtra, India
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      <Modal
        open={deadlineOpen}
        onClose={closeDeadlineEditor}
        title={editingDeadline ? 'Edit deadline' : 'Add deadline'}
        icon={FiCalendar}
        size="sm"
      >
        <form onSubmit={saveDeadline} className="space-y-4">
          <label htmlFor="deadline-type" className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Deadline type
            <select
              id="deadline-type"
              name="deadline-type"
              value={deadlineForm.type}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, type: event.target.value }))}
              disabled={Boolean(editingDeadline)}
              className="input"
            >
              <option value="shoot-day">Shoot day</option>
              <option value="project-wrap">Project wrap</option>
            </select>
          </label>
          <label htmlFor="deadline-project" className="block space-y-1.5 text-xs font-medium text-zinc-400">
            Project
            <select
              id="deadline-project"
              name="deadline-project"
              value={deadlineForm.projectId}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, projectId: event.target.value }))}
              required={deadlineForm.type === 'project-wrap'}
              disabled={editingDeadline?.kind === 'project-wrap'}
              className="input"
            >
              <option value="">Unassigned</option>
              {data.projects.map((item) => (
                <option key={item.id} value={String(item.id)}>{item.title}</option>
              ))}
            </select>
          </label>
          <Input
            id="deadline-date"
            name="deadline-date"
            label="Date"
            type="date"
            value={deadlineForm.date}
            onChange={(event) => setDeadlineForm((form) => ({ ...form, date: event.target.value }))}
            required
          />
          {deadlineForm.type === 'shoot-day' && (
            <Input
              id="deadline-location"
              name="deadline-location"
              label="Location"
              value={deadlineForm.location}
              onChange={(event) => setDeadlineForm((form) => ({ ...form, location: event.target.value }))}
              placeholder="Optional"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDeadlineEditor}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingDeadline}>
              {savingDeadline ? 'Saving...' : editingDeadline ? 'Save changes' : 'Add deadline'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* HELPER COMPONENTS */

function SearchField({ id, name, label, value, onChange, options, placeholder }) {
  const fieldId = id || `search-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <select
        id={fieldId}
        name={name || fieldId}
        className="input"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value || opt.label} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

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

function AIFeatureCard({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="premium-card group flex flex-col p-6 transition-all hover:border-gold-500/40">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">AI Engine</p>
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1"
      >
        {action} <FiArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RouteCard({ number, eyebrow, title, description, action, onAction }) {
  return (
    <div className="premium-card group flex flex-col p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">
        {number} - {eyebrow}
      </p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
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

function DepartmentChip({ label, sub }) {
  return (
    <div className="premium-card group flex items-start gap-3 p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        <FiFilm className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-serif text-base font-semibold text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
      </div>
    </div>
  );
}

function StageChip({ number, label, note, active = false }) {
  return (
    <div className={`premium-card relative overflow-hidden p-5 ${active ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <p className="font-serif text-4xl font-bold leading-none text-gold-400/25 transition-colors">
        {number}
      </p>
      <p className="mt-3 font-serif text-lg font-semibold text-zinc-100">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
      {active && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-gold-400 animate-pulse-gold" />
      )}
    </div>
  );
}

function JourneyCard({ title, steps, description }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300">
              {step}
            </span>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function UrgencyCard({ label, value, note, action, onAction }) {
  return (
    <div className="premium-card group p-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{label}</p>
      <p className="mt-3 font-serif text-5xl font-bold text-gold-gradient">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1"
      >
        {action} <FiArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PrincipleCard({ title, description }) {
  return (
    <div className="premium-card p-5">
      <h4 className="font-serif text-base font-semibold text-zinc-100">{title}</h4>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{description}</p>
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

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </div>
      <p className="mt-2 font-serif text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

/* DATA HELPERS */

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
        detail: [shootDay.location || 'Location not set', project?.title].filter(Boolean).join(' - '),
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