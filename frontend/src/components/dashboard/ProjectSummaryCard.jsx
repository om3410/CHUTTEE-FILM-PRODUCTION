import {useQuery} from '@tanstack/react-query';
import {Card} from '../ui/Card';
import { Badge } from '../ui/Badge';
import {useProjectStore} from '../../store/projectStore';
import {TrendUpIcon, CalendarIcon} from '../../icons';
import api from '../../api';

export default function ProjectSummaryCard() {
  const activeId = useProjectStore((s) => s.activeProjectId);
  const {data:project} = useQuery({
    queryKey: ['project', activeId],
    queryFn: async () => {
      const {data} = await api.get(`/projects/${activeId}/`);
      return data;
    },
    enabled: !!activeId,
  });
  if (!project) return <Card className="p-5 h-40 animate-pulse" />;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{project.title}</h2>
              <Badge variant="amber">{project.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {project.crewCount} crew - {project.castCount} cast
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Completion</p>
            <p className="text-2xl font-bold text-amber-400">{project.completion}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000" style={{width: `${project.completion}%`}}></div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-zinc-800">
        <Stat label="Budget" value={`Rs ${(project.budgetTotal / 100000).toFixed(1)}L`} icon={TrendUpIcon} />
        <Stat label="Spent" value={`Rs ${(project.budgetSpent / 100000).toFixed(1)}L`} icon={TrendUpIcon} />
        <Stat label="Wrap" value={project.wrapDate} icon={CalendarIcon} />
      </div>
    </Card>
  );
}

function Stat({label, value, icon:Icon}){
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}