import type { StateCreator } from 'zustand';

export type ActiveTool = 'select' | 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local';
export type ViewMode = 'perspective' | 'orthographic' | 'top' | 'front' | 'right';

export interface UISlice {
  activeTool: ActiveTool;
  transformSpace: TransformSpace;
  viewMode: ViewMode;
  showGrid: boolean;
  showStats: boolean;
  hierarchyPanelOpen: boolean;
  propertiesPanelOpen: boolean;
  assetPanelOpen: boolean;
  aiCommandBarOpen: boolean;
  setActiveTool: (tool: ActiveTool) => void;
  setTransformSpace: (space: TransformSpace) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleGrid: () => void;
  toggleStats: () => void;
  toggleHierarchyPanel: () => void;
  togglePropertiesPanel: () => void;
  toggleAssetPanel: () => void;
  openAICommandBar: () => void;
  closeAICommandBar: () => void;
  shadersEnabled: boolean;
  outlineEnabled: boolean;
  aoEnabled: boolean;
  fogEnabled: boolean;
  toggleShaders: () => void;
  toggleOutline: () => void;
  toggleAO: () => void;
  toggleFog: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  activeTool: 'translate',
  transformSpace: 'world',
  viewMode: 'perspective',
  showGrid: true,
  showStats: false,
  hierarchyPanelOpen: true,
  propertiesPanelOpen: true,
  assetPanelOpen: true,
  aiCommandBarOpen: false,
  shadersEnabled: true,
  outlineEnabled: true,
  aoEnabled: true,
  fogEnabled: false,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setTransformSpace: (space) => set({ transformSpace: space }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),
  toggleHierarchyPanel: () => set((s) => ({ hierarchyPanelOpen: !s.hierarchyPanelOpen })),
  togglePropertiesPanel: () => set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
  toggleAssetPanel: () => set((s) => ({ assetPanelOpen: !s.assetPanelOpen })),
  openAICommandBar: () => set({ aiCommandBarOpen: true }),
  closeAICommandBar: () => set({ aiCommandBarOpen: false }),
  toggleShaders: () => set((s) => ({ shadersEnabled: !s.shadersEnabled })),
  toggleOutline: () => set((s) => ({ outlineEnabled: !s.outlineEnabled })),
  toggleAO: () => set((s) => ({ aoEnabled: !s.aoEnabled })),
  toggleFog: () => set((s) => ({ fogEnabled: !s.fogEnabled })),
});
