import { motion } from 'framer-motion';

export default function StageCard({ number, title, description, icon: Icon, active = false }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`premium-card group relative overflow-hidden p-6 ${active ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <p className="font-serif text-5xl font-bold leading-none text-gold-400/25 group-hover:text-gold-400/40 transition-colors">
        {String(number).padStart(2, '0')}
      </p>
      {Icon && (
        <div className="mt-4 grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
          <Icon size={18} />
        </div>
      )}
      <h3 className="mt-4 font-serif text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
      {active && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-gold-400 animate-pulse-gold" />}
    </motion.div>
  );
}
