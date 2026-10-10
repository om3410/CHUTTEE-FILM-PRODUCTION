import { useState } from 'react';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';

export default function KanbanBoard({ columns, items, onMove, renderItem }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const list = items.filter((i) => i.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => { e.preventDefault(); setOverColumn(col); }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOverColumn(null);
              const id = e.dataTransfer.getData('text/plain');
              if (id) onMove(id, col);
            }}
            className={`rounded-xl border bg-zinc-900/40 p-3 transition-colors ${overColumn === col ? 'border-brand-500/60 bg-brand-500/5' : 'border-zinc-800'}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{col}</h3>
              <Badge>{list.length}</Badge>
            </div>
            <div className="min-h-[120px] space-y-2">
              {list.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); setDraggingId(item.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab active:cursor-grabbing ${draggingId === item.id ? 'opacity-50' : ''}`}
                >
                  {renderItem(item)}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}