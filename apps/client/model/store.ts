// create zustand store

import create from 'zustand';

interface AppStore {
  loadCount: number;

  incrementLoadCount: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  loadCount: 0,
  incrementLoadCount: () =>
    set((state) => ({ loadCount: state.loadCount + 1 })),
}));
