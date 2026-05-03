import type { StateCreator } from 'zustand';

export interface SelectionSlice {
  selectedIds: string[];
  hoveredId: string | null;
  selectObject: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  setHovered: (id: string | null) => void;
  toggleSelection: (id: string) => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice, [], [], SelectionSlice> = (set) => ({
  selectedIds: [],
  hoveredId: null,

  selectObject: (id, additive = false) =>
    set((state) =>
      additive
        ? { selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id] }
        : { selectedIds: [id] }
    ),

  deselectAll: () => set({ selectedIds: [] }),

  setHovered: (id) => set({ hoveredId: id }),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((s) => s !== id)
        : [...state.selectedIds, id],
    })),
});
