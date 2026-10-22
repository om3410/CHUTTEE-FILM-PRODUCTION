import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'react-icons/fi';
import { formatINRCompact } from '../../lib/utils';
import Badge from '../ui/Badge';

export default function ProjectCard({ project, onClick }) {
  const { title, poster, status, director, location, releaseDate, budget = 0, progress = 0 } = project;
  return (
    <motion.article onClick={onClick} whileHover={{ y: -5 }} className="premium-card group cursor-pointer overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
        {poster ? (
          <img src={poster} alt={title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="grid h-full place-items-center bg-zinc-950 font-serif text-5xl text-gold-400/20">{title?.[0]}</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute right-3 top-3"><Badge variant="brand">{status}</Badge></div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-serif text-2xl font-bold text-white">{title}</h3>
          {director && <p className="mt-1 text-xs text-white/70">Dir. {director}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {location && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{location}</span>}
          {releaseDate && <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{releaseDate}</span>}
        </div>
        <div className="gold-divider" />
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Budget</p>
            <p className="font-serif text-3xl font-bold text-gold-gradient">{formatINRCompact(budget)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Progress</p>
            <p className="font-serif text-lg font-bold">{progress}%</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
