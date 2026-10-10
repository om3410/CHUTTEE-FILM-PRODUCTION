import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import {
  DashboardIcon, CrewIcon, UserIcon, FolderIcon, SceneIcon,
  CalendarIcon, BudgetIcon, CameraIcon, ChartIcon, SettingsIcon,
} from '../../icons';

const items = [
  { label: 'Dashboard', to: '/', icon: DashboardIcon },
  { label: 'Crew', to: '/crew', icon: CrewIcon },
  { label: 'Cast', to: '/cast', icon: UserIcon },
  { label: 'Projects', to: '/projects', icon: FolderIcon },
  { label: 'Scenes', to: '/scenes', icon: SceneIcon },
  { label: 'Schedule', to: '/schedule', icon: CalendarIcon },
  { label: 'Budget', to: '/budget', icon: BudgetIcon },
  { label: 'Equipment', to: '/equipment', icon: CameraIcon },
  { label: 'Analytics', to: '/analytics', icon: ChartIcon },
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
];

export function CommandPalette() {
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const s = useUIStore.getState();
        s.commandPaletteOpen ? s.closeCommandPalette() : s.openCommandPalette();
      }
      if (e.key === 'Escape' && commandPaletteOpen) closeCommandPalette();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, closeCommandPalette]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] px-4" onClick={closeCommandPalette}>
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Command>
          <Command.Input
            placeholder="Search or jump to..."
            autoFocus
            className="w-full border-b border-zinc-800 bg-transparent px-4 py-3.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="p-6 text-center text-sm text-zinc-500">No results found.</Command.Empty>
            {items.map(({ label, to, icon: Icon }) => (
              <Command.Item
                key={to}
                onSelect={() => { navigate(to); closeCommandPalette(); }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}