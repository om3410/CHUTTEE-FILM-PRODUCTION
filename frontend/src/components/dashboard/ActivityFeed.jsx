import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import api from '../../api';

export default function ActivityFeed() {
  const { data } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const { data } = await api.get('/activity/');
      return data;
    },
  });

  const items = data?.items ?? [];

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">Recent Activity</h3>
      <ul className="divide-y divide-zinc-800/60">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs text-amber-400 font-bold">
              *
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200">{a.message}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{a.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}