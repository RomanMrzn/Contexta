import { create } from 'zustand';
import { OpenedFile } from '@openanything/platform';

interface AppState {
  activeFiles: OpenedFile[];
  addFiles: (files: OpenedFile[]) => void;
  removeFile: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeFiles: [],
  
  addFiles: (files) => set((state) => {
    // Basic implementation: just append to the active tabs
    return { activeFiles: [...state.activeFiles, ...files] };
  }),
  
  removeFile: (id) => set((state) => ({
    activeFiles: state.activeFiles.filter(f => f.id !== id)
  })),
}));
