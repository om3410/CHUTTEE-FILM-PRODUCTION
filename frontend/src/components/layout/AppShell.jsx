import { NavLink } from 'react-router-dom';
import {
  FiHome as DashboardIcon, FiUsers as CrewIcon, FiUser as UserIcon, FiFolder as FolderIcon, FiVideo as SceneIcon,
  FiCalendar as CalendarIcon, FiDollarSign as BudgetIcon, FiCamera as CameraIcon, FiBarChart2 as ChartIcon, FiSettings as SettingsIcon, FiFilm,
} from 'react-icons/fi';
import { useUIStore } from '../../store/uiStore';

const nav = [
  { to: '/', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/crew', icon: CrewIcon, label: 'Crew' },
  { to: '/cast', icon: UserIcon, label: 'Cast' },
  { to: '/projects', icon: FolderIcon, label: 'Projects' },
  { to: '/scenes', icon: SceneIcon, label: 'Scenes' },
  { to: '/schedule', icon: CalendarIcon, label: 'Schedule' },
  { to: '/budget', icon: BudgetIcon, label: 'Budget' },
  { to: '/equipment', icon: CameraIcon, label: 'Equipment' },
  { to: '/analytics', icon: ChartIcon, label: 'Analytics' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-800 bg-zinc-900/40 transition-all duration-300`}>
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
        <FiFilm className="h-7 w-7 text-amber-400" />
        {sidebarOpen && <span className="text-lg font-bold tracking-tight">CHUTTEE</span>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}