import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Lightbox({ images = [], index = 0, onClose, onChange }) {
  if (!images.length) return null;
  const current = images[index];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-zinc-900/70 p-2 text-zinc-300 hover:bg-zinc-800">
          <FiX className="h-5 w-5" />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} className="absolute left-4 rounded-full bg-zinc-900/70 p-3 text-zinc-300 hover:bg-zinc-800">
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }} className="absolute right-4 rounded-full bg-zinc-900/70 p-3 text-zinc-300 hover:bg-zinc-800">
              <FiChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <motion.img key={current} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={current} alt="" onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
      </motion.div>
    </AnimatePresence>
  );
}