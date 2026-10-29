import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import { CommandPalette } from '../search/CommandPalette';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 page-enter">
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}