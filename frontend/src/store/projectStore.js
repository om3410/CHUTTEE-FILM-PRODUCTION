import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export const useProjectStore = create(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProject: (id) => set({activeProjectId:id}),
    }),
    {name: 'chuttee-project'}
  )
);