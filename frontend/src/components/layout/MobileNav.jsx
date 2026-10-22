import { NavLink } from 'react-router-dom';
import { FiLayout, FiFilm, FiUsers, FiDollarSign, FiSettings } from 'react-icons/fi';
import { cn } from '../../lib/utils';

const TABS = [
  { to: '/', label: 'Home', icon: FiLayout, end: true },
  { to: '/projects', label: 'Shoots', icon: FiFilm },
  { to: '/crew', label: 'Crew', icon: FiUsers },
  { to: '/budget', label: 'Budget', icon: FiDollarSign },
  { to: '/settings', label: 'More', icon: FiSettings },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px]',
              isActive ? 'text-gold-400' : 'text-zinc-500'
            )}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
