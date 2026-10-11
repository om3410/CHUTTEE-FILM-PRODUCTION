import { NavLink } from "react-router-dom";
import { DashboardIcon, CrewIcon } from "../../icons";
import { FiUser, FiVideo, FiDollarSign, FiCamera, FiCpu, FiCreditCard, FiSettings } from 'react-icons/fi';

const nav = [
  {to: '/', icon: DashboardIcon, label: 'Home'},
  {to: '/crew', icon: CrewIcon, label: 'Crew'},
  {to: '/cast', icon: FiUser, label: 'Cast'},
  {to: '/scenes', icon: FiVideo, label: 'Scenes'},
  {to: '/budget', icon: FiDollarSign, label: 'Budget'},
  {to: '/assets', icon: FiCamera, label: 'Film Assets'},
  {to: '/ai', icon: FiCpu, label: 'AI Insights'},
  {to: '/billing', icon: FiCreditCard, label: 'Billing'},
  {to: '/settings', icon: FiSettings, label: 'Settings'},
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden">
      {nav.map(({to, icon: Icon, label}) => (
        <NavLink
        key={to}
        to={to}
        end={to==='/'}
        title={label}
        className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-zinc-500'}`
        }
        >
          <Icon className="h-5 w-5"/>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}