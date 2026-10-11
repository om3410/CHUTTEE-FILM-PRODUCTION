import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const labels = {
  crew: 'Crew', cast: 'Cast', scenes: 'Scenes', budget: 'Budget', assets: 'Film Assets',
  activity: 'Activity', ai: 'AI Insights', inbox: 'Inbox', billing: 'Billing', settings: 'Settings',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 animate-fade-in">
      <Link to="/" className="flex items-center gap-1 transition-colors hover:text-zinc-200">
        <FiHome className="h-3 w-3" /> Home
      </Link>
      {parts.map((p, i) => {
        const isLast = i === parts.length - 1;
        const to = '/' + parts.slice(0, i + 1).join('/');
        return (
          <span key={to} className="flex items-center gap-1.5">
            <FiChevronRight className="h-3 w-3" />
            {isLast ? <span className="text-zinc-200">{labels[p] || p}</span> : <Link to={to} className="transition-colors hover:text-zinc-200">{labels[p] || p}</Link>}
          </span>
        );
      })}
    </nav>
  );
}