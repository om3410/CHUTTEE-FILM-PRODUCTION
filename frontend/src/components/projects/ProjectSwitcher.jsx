import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FolderIcon, ChevronDownIcon, CheckIcon } from '../../icons';
import { useProjectStore } from '../../store/projectStore';
import api from '../../api';

export function ProjectSwitcher() {
  const { activeProjectId, setActiveProject } = useProjectStore();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await api.get('/projects/');
      return data.results;
    },
  });

  const projects = data || [];
  const active = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:border-zinc-600"
      >
        <FolderIcon className="h-4 w-4 text-amber-400" />
        <span className="max-w-[140px] truncate font-medium text-zinc-200">
          {active?.title || 'Select project'}
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveProject(p.id); setOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-800/60"
            >
              <div>
                <p className="text-sm font-medium text-zinc-200">{p.title}</p>
                <p className="text-xs text-zinc-500">{p.status} - {p.completion}%</p>
              </div>
              {active?.id === p.id && <CheckIcon className="h-4 w-4 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}