import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiUsers, FiUser, FiVideo, FiDollarSign, FiCamera, FiFilm, FiActivity, FiCpu, FiInbox, FiCreditCard, FiSettings, FiHelpCircle } from 'react-icons/fi';

const nav = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/crew', icon: FiUsers, label: 'Crew' },
  { to: '/cast', icon: FiUser, label: 'Cast' },
  { to: '/scenes', icon: FiVideo, label: 'Scenes' },
  { to: '/budget', icon: FiDollarSign, label: 'Budget' },
  { to: '/assets', icon: FiCamera, label: 'Film Assets' },
  { to: '/activity', icon: FiActivity, label: 'Activity Feed' },
  { to: '/ai', icon: FiCpu, label: 'AI Insights' },
  { to: '/inbox', icon: FiInbox, label: 'Inbox' },
  { to: '/billing', icon: FiCreditCard, label: 'Billing' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

export default function Sidebar({ open }) {
  const renderLink = ({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      title={!open ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive ? 'bg-brand-500/10 text-brand-400' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-500" />
          )}
          <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
          {open && (
            <span className="truncate">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className={`${open ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-800 bg-zinc-900/40 transition-all duration-300`}>
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 animate-scale-in">
          <FiFilm className="h-5 w-5 text-brand-400" />
        </div>
        {open && <span className="text-lg font-bold tracking-tight animate-fade-in">CHUTTEE</span>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(renderLink)}</nav>
      <div className="space-y-1 border-t border-zinc-800 p-3">
        {open && (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <FiHelpCircle className="h-3.5 w-3.5" />
              <span>Press ⌘K for anything</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}