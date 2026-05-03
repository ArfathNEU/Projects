import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createSceneSlice, type SceneSlice } from './slices/sceneSlice';
import { createSelectionSlice, type SelectionSlice } from './slices/selectionSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createHistorySlice, type HistorySlice } from './slices/historySlice';

export type RootStore = SceneSlice & SelectionSlice & UISlice & HistorySlice;

export const useStore = create<RootStore>()(
  subscribeWithSelector((...a) => ({
    ...createSceneSlice(...a),
    ...createSelectionSlice(...a),
    ...createUISlice(...a),
    ...createHistorySlice(...a),
  }))
);

// Typed selector hooks
export const useScene       = () => useStore((s) => s.scene);
export const useObjects     = () => useStore((s) => s.scene.objects);
export const useSelectedIds = () => useStore((s) => s.selectedIds);
export const useHoveredId   = () => useStore((s) => s.hoveredId);
export const useActiveTool  = () => useStore((s) => s.activeTool);
// NOTE: consumers should use useShallow when selecting multiple fields as an object
