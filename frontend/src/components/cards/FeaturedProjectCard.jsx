import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight } from 'react-icons/fi';
import { formatINRCompact } from '../../lib/utils';
import Badge from '../ui/Badge';

export default function FeaturedProjectCard({ project, onClick }) {
  const { title, poster, status, director, location, releaseDate, budget = 0, progress = 0, genre, description } = project;
  return (
    <motion.article onClick={onClick} whileHover={{ y: -4 }} className="premium-card group cursor-pointer overflow-hidden lg:flex">
      <div className="relative lg:w-1/2 aspect-[16/10] lg:aspect-auto overflow-hidden">
        {poster ? (
          <img src={poster} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="grid h-full place-items-center bg-zinc-950 font-serif text-6xl text-gold-400/20">{title?.[0]}</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:bg-gradient-to-r" />
        <div className="absolute left-4 top-4"><Badge variant="brand">{status}</Badge></div>
      </div>
      <div className="flex flex-col justify-center p-6 lg:w-1/2 lg:p-8">
        {genre && <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">{genre}</p>}
        <h2 className="mt-2 font-serif text-3xl font-bold">{title}</h2>
        {director && <p className="mt-1 text-sm text-zinc-500">Dir. {director}</p>}
        {description && <p className="mt-4 text-sm text-zinc-500 line-clamp-3">{description}</p>}
        <div className="gold-divider my-5" />
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          {location && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{location}</span>}
          {releaseDate && <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{releaseDate}</span>}
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Budget</p>
            <p className="font-serif text-2xl font-bold text-gold-gradient">{formatINRCompact(budget)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Progress</p>
            <p className="font-serif text-lg font-bold">{progress}%</p>
          </div>
        </div>
        <div className="mt-6 inline-flex items-center gap-1.5 text-sm text-gold-400 group-hover:translate-x-1 transition-transform">
          View production <ArrowRight size={14} />
        </div>
      </div>
    </motion.article>
  );
}
