import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiX, FiDownload } from 'react-icons/fi';
import Button from './ui/Button';

export default function BulkActionsBar({ count, onClear, onDelete, onExport }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur"
        >
          <span className="text-sm text-zinc-300"><span className="font-semibold text-brand-400">{count}</span> selected</span>
          <div className="h-5 w-px bg-zinc-700" />
          {onExport && <Button size="sm" variant="ghost" icon={FiDownload} onClick={onExport}>Export</Button>}
          {onDelete && <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" icon={FiTrash2} onClick={onDelete}>Delete</Button>}
          <button onClick={onClear} title="Clear selection" aria-label="Clear selection" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800"><FiX className="h-4 w-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}