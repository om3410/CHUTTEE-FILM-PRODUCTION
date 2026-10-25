import { NavLink } from 'react-router-dom';
import {
  FiLayout, FiUsers, FiUserCheck, FiFilm, FiDollarSign,
  FiActivity, FiCpu, FiInbox, FiCreditCard, FiSettings,
  FiHelpCircle, FiVideo, FiShield, FiZap,
} from 'react-icons/fi';
import { cn } from '../../lib/utils';

const TABS = [
  { to: '/',          label: 'Home',     icon: FiLayout,      end: true },
  { to: '/crew',      label: 'Crew',     icon: FiUsers },
  { to: '/cast',      label: 'Cast',     icon: FiUserCheck },
  { to: '/scenes',    label: 'Scenes',   icon: FiFilm },
  { to: '/budget',    label: 'Budget',   icon: FiDollarSign },
  { to: '/assets',    label: 'Assets',   icon: FiVideo },
  { to: '/activity',  label: 'Activity', icon: FiActivity },
  { to: '/ai',        label: 'AI',       icon: FiCpu },
  { to: '/studio',    label: 'Studio',   icon: FiZap },
  { to: '/inbox',     label: 'Inbox',    icon: FiInbox },
  { to: '/billing',   label: 'Billing',  icon: FiCreditCard },
  { to: '/settings',  label: 'Settings', icon: FiSettings },
  { to: '/help',      label: 'Help',     icon: FiHelpCircle },
  { to: '/security',  label: 'Security', icon: FiShield },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex overflow-x-auto no-scrollbar">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              'flex shrink-0 flex-col items-center justify-center gap-1 px-4 py-2.5 text-[10px]',
              isActive ? 'text-gold-400' : 'text-zinc-500'
            )}>
            <Icon size={20} />
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
