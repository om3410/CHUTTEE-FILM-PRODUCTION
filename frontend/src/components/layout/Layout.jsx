import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { MobileNav } from './MobileNav';
import CommandPalette from '../CommandPalette';
import QuickCreate from '../QuickCreate';
import AIChatWidget from '../ai/AIChatWidget';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { DEPARTMENTS } from '../../utils/constants';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [crewSearch, setCrewSearch] = useState('');
  const [crewDepartment, setCrewDepartment] = useState('');
  const [crewAvailability, setCrewAvailability] = useState('');
  const [crewDepartments, setCrewDepartments] = useState(DEPARTMENTS);

  useKeyboardShortcuts({ 'cmd+k': () => setCommandOpen((o) => !o) });

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
          crewSearch={crewSearch}
          onCrewSearchChange={setCrewSearch}
          crewDepartment={crewDepartment}
          onCrewDepartmentChange={setCrewDepartment}
          crewAvailability={crewAvailability}
          onCrewAvailabilityChange={setCrewAvailability}
          crewDepartments={crewDepartments}
        />
        <motion.main
          className="flex-1 overflow-y-auto p-4 pb-20 md:p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Outlet context={{ crewSearch, crewDepartment, crewAvailability, setCrewDepartments }} />
        </motion.main>
      </div>
      <MobileNav />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <QuickCreate open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />
      <AIChatWidget />
    </div>
  );
}