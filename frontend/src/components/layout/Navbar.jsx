import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiSun, FiMoon, FiPlus, FiMenu } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../store/uiStore';

export default function Navbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isJwt = (v) => typeof v === 'string' && v.startsWith('eyJ') && v.length > 100;
  const safeName = isJwt(user?.name) ? null : user?.name;
  const safeEmail = isJwt(user?.email) ? null : user?.email;
  const navigate = useNavigate();
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  return (
    <header className="glass-nav sticky top-0 z-30 border-b border-zinc-800">
      {/* Contact strip */}
      <div className="hidden md:flex h-7 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/40 px-6 text-[11px] text-zinc-500">
        <span>omrewaskar4@gmail.com . +91 74101 14971</span>
        <span className="text-gold-400">Film Production Management</span>
      </div>

      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-premium p-2 text-zinc-500 hover:text-gold-400 transition"
          aria-label="Toggle sidebar"
        >
          <FiMenu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-premium bg-gradient-to-br from-gold-300 to-gold-600 shadow-gold">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="CHUTTEE"
            >
              <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
              <path d="m6.2 5.3 3.1 3.9" />
              <path d="m12.4 3.4 3.1 4" />
              <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="font-serif text-lg font-bold leading-none text-gold-gradient">CHUTTEE</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">Film Production</p>
          </div>
        </Link>

        {/* Global search */}
        <div className="relative hidden md:flex flex-1 max-w-lg">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search anything…"
            onClick={openCommandPalette}
            onFocus={openCommandPalette}
            readOnly
            className="w-full cursor-pointer rounded-premium border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-16 text-sm placeholder:text-zinc-600 focus:border-gold-500 focus:outline-none transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
            ⌘K
          </kbd>
        </div>

        <div className="flex-1 md:flex-none" />

        {/* Create */}
        <button
          onClick={() => navigate('/scenes')}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-premium border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs font-medium text-gold-400 transition-all hover:border-gold-500 hover:shadow-gold"
        >
          <FiPlus size={14} /> Create
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-premium p-2 text-zinc-500 hover:text-gold-400 transition"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/activity')}
          className="relative rounded-premium p-2 text-zinc-500 hover:text-gold-400 transition"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse-gold" />
        </button>

        {/* User */}
        {user ? (
          <Link
            to="/settings"
            className="hidden sm:flex items-center gap-2 rounded-premium border border-zinc-800 bg-zinc-900 px-2 py-1.5 transition hover:border-gold-500/40"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full bg-gold-500/10 grid place-items-center font-serif text-sm text-gold-400">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="max-w-[100px] truncate text-xs">
              {safeName || safeEmail || 'Producer'}
            </span>
          </Link>
        ) : (
          <Link
            to="/signin"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-premium border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-gold-500/40 hover:text-gold-400"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}