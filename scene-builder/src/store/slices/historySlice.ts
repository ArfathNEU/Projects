import type { StateCreator } from 'zustand';
import type { SceneGraph } from '@/types/scene';

const MAX_HISTORY = 50;

export interface HistorySlice {
  past: SceneGraph[];
  future: SceneGraph[];
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (scene: SceneGraph) => void;
  undo: (currentScene: SceneGraph) => SceneGraph | null;
  redo: (currentScene: SceneGraph) => SceneGraph | null;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<HistorySlice, [], [], HistorySlice> = (set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushHistory: (scene) =>
    set((state) => {
      const past = [...state.past, scene].slice(-MAX_HISTORY);
      return { past, future: [], canUndo: past.length > 0, canRedo: false };
    }),

  undo: (currentScene) => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [currentScene, ...future].slice(0, MAX_HISTORY),
      canUndo: past.length > 1,
      canRedo: true,
    });
    return previous;
  },

  redo: (currentScene) => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set({
      past: [...past, currentScene].slice(-MAX_HISTORY),
      future: future.slice(1),
      canUndo: true,
      canRedo: future.length > 1,
    });
    return next;
  },

  clearHistory: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
});
