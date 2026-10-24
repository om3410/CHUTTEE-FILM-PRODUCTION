import { FiActivity, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';

const LEVEL_ICONS = { info: FiInfo, warn: FiAlertTriangle, error: FiAlertTriangle };
const LEVEL_COLORS = {
  info: 'text-blue-400 bg-blue-500/15',
  warn: 'text-amber-400 bg-amber-500/15',
  error: 'text-red-400 bg-red-500/15',
};

export default function SecurityEventFeed({ events = [] }) {
  return (
    <Card>
      <CardHeader title="Audit Log" subtitle={`${events.length} events`} icon={FiActivity} />
      <CardBody className="p-0">
        {events.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">
            No events yet. Run an AI feature to generate logs.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {events.slice(0, 100).map((e) => {
              const Icon = LEVEL_ICONS[e.level] || FiInfo;
              return (
                <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={`rounded-lg p-2 ${LEVEL_COLORS[e.level] || LEVEL_COLORS.info}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{e.message}</p>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>{e.action}</span>
                      <span>{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge
                    variant={e.level === 'error' ? 'danger' : e.level === 'warn' ? 'warn' : 'info'}
                  >
                    {e.level}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}