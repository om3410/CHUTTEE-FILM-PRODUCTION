import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiFilm, FiDollarSign, FiUserPlus, FiMessageSquare } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import Card from '../components/ui/Card';
import SkeletonLoader from '../components/feedback/SkeletonLoader';

const iconMap = {
  scene_shot: { icon: FiFilm, color: 'text-brand-400 bg-brand-500/15' },
  expense_added: { icon: FiDollarSign, color: 'text-amber-400 bg-amber-500/15' },
  crew_added: { icon: FiUserPlus, color: 'text-blue-400 bg-blue-500/15' },
  comment: { icon: FiMessageSquare, color: 'text-purple-400 bg-purple-500/15' },
};

export default function ActivityFeed() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setTimeout(() => { setItems(MOCK.activity); setLoading(false); }, 200);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-500/15 p-3"><FiActivity className="h-6 w-6 text-brand-400" /></div>
        <div>
          <h1 className="text-2xl font-bold">Activity Feed</h1>
          <p className="text-sm text-zinc-400">Everything happening on your production.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonLoader key={i} className="h-16" />)}</div>
      ) : (
        <Card className="p-5">
          <ol className="relative space-y-6 border-l border-zinc-800 pl-6">
            {items.map((a, i) => {
              const config = iconMap[a.type] || { icon: FiActivity, color: 'text-zinc-400 bg-zinc-800' };
              const Icon = config.icon;
              return (
                <motion.li key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                  <span className="absolute -left-[38px] flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 ring-4 ring-zinc-950">
                    <div className={`rounded-full p-1.5 ${config.color}`}><Icon className="h-3 w-3" /></div>
                  </span>
                  <p className="text-sm text-zinc-200">{a.message}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{a.timestamp}</p>
                </motion.li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}