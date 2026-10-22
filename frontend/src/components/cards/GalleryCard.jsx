import { motion } from 'framer-motion';
import { Maximize2 } from 'react-icons/fi';

export default function GalleryCard({ image, caption, category, onClick }) {
  return (
    <motion.figure onClick={onClick} whileHover={{ scale: 1.02 }} className="premium-card group cursor-pointer overflow-hidden">
      <div className="relative aspect-[3/2] overflow-hidden bg-zinc-950">
        <img src={image} alt={caption || ''} loading="lazy"
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {category && (
          <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] uppercase text-white/90 backdrop-blur-sm">
            {category}
          </div>
        )}
        <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-premium bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={14} />
        </div>
        {caption && (
          <figcaption className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-serif text-sm font-semibold text-white drop-shadow">{caption}</p>
          </figcaption>
        )}
      </div>
    </motion.figure>
  );
}
