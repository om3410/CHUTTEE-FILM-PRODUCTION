import { motion } from 'framer-motion';
import { Mail, Phone } from 'react-icons/fi';
import { formatINR } from '../../lib/utils';

export default function CrewProfileCard({ person, onClick }) {
  const { name, role, avatar, rate, department, email, phone } = person;
  const src = avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=141414`;
  return (
    <motion.article onClick={onClick} whileHover={{ y: -5 }} className="premium-card group cursor-pointer overflow-hidden p-5 text-center">
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-[2px] overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
          <img src={src} alt={name} className="h-full w-full object-cover" />
        </div>
      </div>
      <h3 className="mt-4 font-serif text-lg font-bold">{name}</h3>
      <p className="text-xs uppercase tracking-wider text-gold-400">{role}</p>
      {department && <p className="mt-1 text-[11px] text-zinc-500">{department}</p>}
      <div className="gold-divider my-4" />
      {rate > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Day Rate</p>
          <p className="font-serif text-2xl font-bold text-gold-gradient">{formatINR(rate)}</p>
        </div>
      )}
    </motion.article>
  );
}
