import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiX, FiHome, FiUsers, FiVideo, FiDollarSign } from 'react-icons/fi';
import Button from './ui/Button';

const STEPS = [
  { icon: FiHome, title: 'Welcome to CHUTTEE', body: 'Your entire production, in one place. Let us show you around.' },
  { icon: FiUsers, title: 'Track your crew', body: 'Manage availability, rates, and skills from the Crew page.' },
  { icon: FiVideo, title: 'Plan every scene', body: 'Drag scenes across the Kanban board to track progress.' },
  { icon: FiDollarSign, title: 'Stay on budget', body: 'Log expenses and watch the burn-down chart in real time.' },
];

export default function OnboardingTour({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-500/15 p-2.5 text-brand-400"><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Step {step + 1} of {STEPS.length}</p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-100">{s.title}</h2>
                </div>
              </div>
              <button onClick={onClose} title="Close tour" aria-label="Close tour" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800"><FiX className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm text-zinc-400">{s.body}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-zinc-700'}`} />
                ))}
              </div>
              <Button variant="primary" iconRight={FiArrowRight} onClick={() => { if (isLast) onComplete?.() || onClose(); else setStep((n) => n + 1); }}>
                {isLast ? 'Get started' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}