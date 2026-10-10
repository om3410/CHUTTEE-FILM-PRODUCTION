import { FiSearch, FiSun, FiMoon, FiChevronDown, FiMenu, FiLogOut, FiUser, FiSettings, FiCommand, FiHelpCircle, FiZap } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import Breadcrumbs from './Breadcrumbs';
import { NotificationBell } from '../notifications/NotificationBell';

export default function Navbar({
  onToggleSidebar,
  onOpenCommand,
  onOpenQuickCreate,
  crewSearch,
  onCrewSearchChange,
  crewDepartment,
  onCrewDepartmentChange,
  crewAvailability,
  onCrewAvailabilityChange,
  crewDepartments,
}) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCrewPage = location.pathname === '/crew';

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/40 px-4 backdrop-blur animate-fade-in md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onToggleSidebar} title="Toggle sidebar" aria-label="Toggle sidebar" className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800">
            <FiMenu className="h-5 w-5" />
          </button>
          <div className="hidden md:block"><Breadcrumbs /></div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={onOpenCommand} title="Search anything" aria-label="Search anything" className="hidden w-72 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800/60 2xl:flex">
            <FiSearch className="h-4 w-4" />
            <span className="truncate">Search anything…</span>
            <kbd className="ml-auto flex items-center gap-0.5 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px]">
              <FiCommand className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
          <button onClick={onOpenCommand} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 2xl:hidden" title="Search anything" aria-label="Search anything"><FiSearch className="h-5 w-5" /></button>
          <button onClick={onOpenQuickCreate} className="hidden rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 md:block" title="Quick create" aria-label="Quick create"><FiZap className="h-5 w-5" /></button>
          <button onClick={() => navigate('/help')} className="hidden rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 md:block" title="Help" aria-label="Help"><FiHelpCircle className="h-5 w-5" /></button>
          <NotificationBell />
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800">
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          <Dropdown trigger={
            <span title="Account menu" className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-zinc-800">
              <Avatar name={user?.name || 'User'} size="sm" />
              <FiChevronDown className="h-4 w-4 text-zinc-400" />
            </span>
          }>
            <div className="border-b border-zinc-800 px-4 py-2">
              <p className="text-xs text-zinc-500">Signed in as</p>
              <p className="truncate text-sm text-zinc-200">{user?.email}</p>
            </div>
            <DropdownItem icon={FiUser} onClick={() => navigate('/settings')}>Profile</DropdownItem>
            <DropdownItem icon={FiSettings} onClick={() => navigate('/settings')}>Settings</DropdownItem>
            <DropdownItem icon={FiHelpCircle} onClick={() => navigate('/help')}>Help & support</DropdownItem>
            <DropdownItem icon={FiLogOut} onClick={logout} className="text-red-400 hover:bg-red-500/10">Logout</DropdownItem>
          </Dropdown>
        </div>
      </div>
      {isCrewPage && (
        <div className="flex flex-col gap-3 border-t border-zinc-800/70 py-3 sm:flex-row sm:justify-end">
          <div className="relative sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={crewSearch}
              onChange={(event) => onCrewSearchChange(event.target.value)}
              placeholder="Search name, role, email, or skill…"
              className="input pl-10"
              aria-label="Search crew by name, role, email, department, or skill"
            />
          </div>
          <select
            value={crewDepartment}
            onChange={(event) => onCrewDepartmentChange(event.target.value)}
            className="input sm:w-48"
            aria-label="Filter crew by department"
          >
            <option value="">All Departments</option>
            {crewDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select
            value={crewAvailability}
            onChange={(event) => onCrewAvailabilityChange(event.target.value)}
            className="input sm:w-40"
            aria-label="Filter crew by availability"
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
          {(crewSearch || crewDepartment || crewAvailability) && (
            <button
              type="button"
              onClick={() => { onCrewSearchChange(''); onCrewDepartmentChange(''); onCrewAvailabilityChange(''); }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </header>
  );
}