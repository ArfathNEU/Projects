import { useEffect } from 'react';
import { useStore } from '@/store';
import { removeObjectFromYjs } from '@/store/middleware/yjsMiddleware';
import type { ActiveTool } from '@/store/slices/uiSlice';

export function useKeyboardShortcuts() {
  const store = useStore;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const { setActiveTool, openAICommandBar, closeAICommandBar, aiCommandBarOpen,
              canUndo, canRedo, undo, redo, scene } = store.getState();

      // Cmd+K / Ctrl+K — AI command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        aiCommandBarOpen ? closeAICommandBar() : openAICommandBar();
        return;
      }

      // Cmd+Z / Ctrl+Z — undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          const prev = undo(scene);
          if (prev) store.setState({ scene: prev });
        }
        return;
      }

      // Cmd+Shift+Z / Ctrl+Y — redo
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
          ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo) {
          const next = redo(scene);
          if (next) store.setState({ scene: next });
        }
        return;
      }

      // Tool shortcuts
      const toolMap: Record<string, ActiveTool> = {
        'q': 'select',
        'g': 'translate',
        'r': 'rotate',
        's': 'scale',
      };
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) setActiveTool(tool);
      }

      // Delete / Backspace — delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedIds, removeObject, deselectAll } = store.getState();
        selectedIds.forEach((id: string) => {
          removeObject(id);
          removeObjectFromYjs(id);
        });
        deselectAll();
      }

      // Escape — deselect
      if (e.key === 'Escape') {
        store.getState().deselectAll();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
