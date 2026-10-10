import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiHome, FiSearch, FiUsers, FiUser, FiVideo, FiDollarSign, FiCamera, FiActivity, FiCpu, FiInbox, FiCreditCard, FiSettings, FiHelpCircle } from 'react-icons/fi';

const items = [
  { label: 'Dashboard', to: '/', icon: FiHome, group: 'Navigate' },
  { label: 'Crew', to: '/crew', icon: FiUsers, group: 'Navigate' },
  { label: 'Cast', to: '/cast', icon: FiUser, group: 'Navigate' },
  { label: 'Scenes', to: '/scenes', icon: FiVideo, group: 'Navigate' },
  { label: 'Budget', to: '/budget', icon: FiDollarSign, group: 'Navigate' },
  { label: 'Film Assets', to: '/assets', icon: FiCamera, group: 'Navigate' },
  { label: 'Activity Feed', to: '/activity', icon: FiActivity, group: 'Navigate' },
  { label: 'AI Insights', to: '/ai', icon: FiCpu, group: 'Navigate' },
  { label: 'Inbox', to: '/inbox', icon: FiInbox, group: 'Navigate' },
  { label: 'Billing', to: '/billing', icon: FiCreditCard, group: 'Navigate' },
  { label: 'Settings', to: '/settings', icon: FiSettings, group: 'Navigate' },
  { label: 'Help', to: '/help', icon: FiHelpCircle, group: 'Navigate' },
];

const groups = ['Navigate'];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
          >
            <Command>
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5">
                <FiSearch className="h-4 w-4 text-zinc-500" />
                <Command.Input autoFocus placeholder="Search or jump to…" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500" />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="p-6 text-center text-sm text-zinc-500">No results found.</Command.Empty>
                {groups.map((g) => (
                  <Command.Group key={g} heading={g} className="mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-600">
                    {items.filter((i) => i.group === g).map(({ label, to, icon: Icon, state }) => (
                      <Command.Item key={`${g}-${label}`} onSelect={() => { navigate(to, { state }); onClose(); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}