import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertIcon } from '../../icons';
import { MOCK, USE_MOCK } from '../../api/mock';
import api from '../../api';

export default function RiskAlerts() {
  const { data } = useQuery({
    queryKey: ['risks'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK.risks;
      const { data } = await api.get('/risks/');
      return data.results;
    },
  });

  const severityVariant = { High: 'red', Medium: 'amber', Low: 'blue' };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertIcon className="h-4 w-4 text-red-400" />
        <h3 className="text-sm font-semibold text-zinc-300">Risk Alerts</h3>
      </div>
      <ul className="space-y-2.5">
        {(data || []).map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="text-xs text-zinc-300">{r.title}</p>
            <Badge variant={severityVariant[r.severity] || 'default'}>{r.severity}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}