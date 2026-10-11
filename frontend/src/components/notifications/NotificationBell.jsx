import { useEffect, useState } from 'react';
import { BellIcon } from '../../icons';
import { fetchRecentNotifications } from '../../api/notifications';

const RESOURCE_LABELS = {
  projects: 'Project',
  crew: 'Crew member',
  cast: 'Cast member',
  scenes: 'Scene',
  'scene-actors': 'Scene cast',
  equipment: 'Equipment',
  'equipment-usage': 'Equipment usage',
  'film-assets': 'Media asset',
  'shoot-days': 'Shoot day',
  'shoot-day-scenes': 'Shoot day scene',
  budget: 'Expense',
  dialogues: 'Dialogue',
  'sentiment-analysis': 'Sentiment analysis',
  risks: 'Production risk',
  festivals: 'Festival submission',
};

const ACTION_LABELS = {
  POST: 'added',
  PUT: 'updated',
  PATCH: 'updated',
  DELETE: 'removed',
};

const timeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const formatNotification = (notification) => {
  const segments = notification.resource.split('/').filter(Boolean);
  const resource = segments[2];
  const label = resource === 'comments' ? 'Production comment' : RESOURCE_LABELS[resource];
  if (!label || !ACTION_LABELS[notification.action]) return null;
  const actor = notification.user_name ? ` by ${notification.user_name}` : '';
  return {
    ...notification,
    title: `${label} ${ACTION_LABELS[notification.action]}${actor}`,
  };
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const [unit, duration] = units.find(([, value]) => Math.abs(seconds) >= value) || ['second', 1];
  return timeFormatter.format(Math.round(seconds / duration), unit);
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    let initialLoad = true;
    const loadNotifications = async () => {
      if (initialLoad) setLoading(true);
      if (initialLoad) setError('');
      try {
        const items = await fetchRecentNotifications();
        if (active) {
          setNotifications(items.map(formatNotification).filter(Boolean));
          setError('');
        }
      } catch {
        if (active) setError('Could not load recent production activity.');
      } finally {
        if (active && initialLoad) setLoading(false);
        initialLoad = false;
      }
    };

    loadNotifications();
    const refresh = window.setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [open]);

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} title="Notifications" aria-label="Notifications" aria-expanded={open} className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800">
        <BellIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold">Recent production activity</span>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">Loading recent activity…</li>
            ) : error ? (
              <li className="px-4 py-6 text-center text-sm text-red-300">{error}</li>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <li key={notification.id} className="border-b border-zinc-800/60 px-4 py-3 last:border-0 hover:bg-zinc-800/40">
                  <p className="text-sm text-zinc-200">{notification.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{formatTime(notification.timestamp)}</p>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">No recent production activity.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}