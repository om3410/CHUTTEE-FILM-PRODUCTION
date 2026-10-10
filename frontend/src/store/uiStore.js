import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      commandPaltteOpen: false,
      toggleTheme: ()=>set((s)=>{
        const next = s.theme === 'dark' ? 'light': 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        return {theme:next};
      }),
      toggleSidebar: () => set((s) => ({sidebarOpen: !s.sidebarOpen})),
      openCommandPalette: () => set({commandPaltteOpen: true}),
      closeCommandPalette: () => set({commandPaltteOpen: false}),
    }),
    {name: 'chuttee-ui', partialize: (s) => ({theme:s.theme, sidebarOpen:s.sidebarOpen})},
  )
);