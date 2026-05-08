import { create } from 'zustand';
import { RemoveSolidBgOptions, PRESET_WHITE } from '../lib/remove-solid-bg';

interface SolidBgOptsStore {
  opts: RemoveSolidBgOptions;
  setOpts: (opts: Partial<RemoveSolidBgOptions>) => void;
}

export const useSolidBgOpts = create<SolidBgOptsStore>((set) => ({
  opts: {
    targetColor: PRESET_WHITE,
    threshold: 20,
    smoothEdges: true,
  },
  setOpts: (partial) =>
    set((state) => ({ opts: { ...state.opts, ...partial } })),
}));
