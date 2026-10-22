import { NavLink } from 'react-router-dom';
import { FiLayout, FiUsers, FiUserCheck, FiFilm, FiDollarSign, FiActivity, FiCpu, FiInbox, FiCreditCard, FiSettings, FiHelpCircle, FiLogOut, FiChevronsLeft, FiChevronsRight, FiVideo } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiLayout, end: true },
  { to: '/crew', label: 'Crew', icon: FiUsers },
  { to: '/cast', label: 'Cast', icon: FiUserCheck },
  { to: '/scenes', label: 'Scenes', icon: FiFilm },
  { to: '/budget', label: 'Budget', icon: FiDollarSign },
  { to: '/assets', label: 'Film Assets', icon: FiVideo },
  { to: '/activity', label: 'Activity', icon: FiActivity },
  { to: '/ai', label: 'AI Insights', icon: FiCpu },
  { to: '/inbox', label: 'Inbox', icon: FiInbox },
  { to: '/billing', label: 'Billing', icon: FiCreditCard },
  { to: '/settings', label: 'Settings', icon: FiSettings },
  { to: '/help', label: 'Help', icon: FiHelpCircle },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore();

  return (
    <aside className={cn('sticky top-0 hidden lg:flex h-screen flex-col border-r border-zinc-800 bg-zinc-900 transition-[width] duration-300', collapsed ? 'w-[76px]' : 'w-[260px]')}>
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-premium bg-gradient-to-br from-gold-300 to-gold-600 shadow-gold">
          <FiFilm size={18} className="text-zinc-950" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold leading-none text-gold-gradient">CHUTTEE</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">Film Production</p>
          </div>
        )}
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}
            className={({ isActive }) => cn(
              'relative flex items-center gap-3 rounded-premium px-3 py-2.5 text-sm transition-all',
              isActive ? 'bg-gold-500/10 text-gold-400 font-medium' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100'
            )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400" />}
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="gold-divider mx-3" />
      <div className={cn('flex items-center gap-3 p-3', collapsed && 'justify-center')}>
        {!collapsed ? (
          <>
            <div className="h-9 w-9 rounded-full bg-gold-500/10 grid place-items-center font-serif text-sm text-gold-400">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">{user?.name || 'Producer'}</p>
              <p className="truncate text-xs text-zinc-500">{user?.email || 'you@chuttee.in'}</p>
            </div>
            <button onClick={logout} className="rounded-premium p-1.5 text-zinc-500 hover:text-gold-400"><FiLogOut size={16} /></button>
          </>
        ) : (
          <button onClick={logout} className="rounded-premium p-2 text-zinc-500 hover:text-gold-400"><FiLogOut size={18} /></button>
        )}
      </div>
      <button onClick={onToggle} className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-premium border border-zinc-800 py-1.5 text-xs text-zinc-500 hover:border-gold-500/40 hover:text-gold-400">
        {collapsed ? <FiChevronsRight size={14} /> : <><FiChevronsLeft size={14} /> <span>Collapse</span></>}
      </button>
    </aside>
  );
}
