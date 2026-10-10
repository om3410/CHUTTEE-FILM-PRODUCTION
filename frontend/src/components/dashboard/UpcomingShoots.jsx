import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CalendarIcon, MapPinIcon, ClockIcon } from '../../icons';
import api from '../../api';

export default function UpcomingShoots() {
  const { data } = useQuery({
    queryKey: ['upcoming-shoots'],
    queryFn: async () => {
      const { data } = await api.get('/production/shoot-days/');
      return data.results;
    },
  });

  const shoots = (data || []).slice(0, 3);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Upcoming Shoots</h3>
        <Badge variant="amber">{shoots.length}</Badge>
      </div>
      <div className="space-y-3">
        {shoots.map((day) => (
          <div key={day.id} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <CalendarIcon className="h-4 w-4" />
              <span className="mt-0.5 text-[10px] font-semibold">
                {day.shoot_date || day.date
                  ? new Date(day.shoot_date || day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  : 'Date TBD'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{day.location}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><ClockIcon className="h-3 w-3" /> {day.start_time || day.callTime || 'Time TBD'}</span>
                {day.scenes && (
                  <span className="flex items-center gap-1"><MapPinIcon className="h-3 w-3" /> {day.scenes.length} scenes</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}