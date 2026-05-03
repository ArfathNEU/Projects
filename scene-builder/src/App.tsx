import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { getRoomId, initProviders, getAwareness } from '@/collab/yjsDoc';
import { subscribeYjsToStore } from '@/store/middleware/yjsMiddleware';
import { setLocalPresence, getUserColor } from '@/collab/awareness';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import SceneCanvas from '@/components/canvas/SceneCanvas';
import HierarchyPanel from '@/components/panels/HierarchyPanel';
import PropertiesPanel from '@/components/panels/PropertiesPanel';
import AssetPanel from '@/components/panels/AssetPanel';
import Toolbar from '@/components/toolbar/Toolbar';
import AICommandBar from '@/components/ai/AICommandBar';
import PresenceAvatars from '@/components/presence/PresenceAvatars';

function useCollabSetup() {
  const collabInitialized = useRef(false);
  const upsertObject = useStore((s) => s.upsertObject);
  const removeObject = useStore((s) => s.removeObject);

  useEffect(() => {
    if (collabInitialized.current) return;
    collabInitialized.current = true;

    const roomId = getRoomId();
    initProviders(roomId);

    subscribeYjsToStore({
      getState: () => ({
        upsertObject,
        removeObject,
        scene: useStore.getState().scene,
      }),
    });

    const awareness = getAwareness();
    if (awareness) {
      setLocalPresence(awareness, {
        id: String(awareness.clientID),
        color: getUserColor(),
        name: `User ${awareness.clientID}`,
        cursor3D: null,
        selectedIds: [],
        activeTool: 'translate',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function App() {
  useKeyboardShortcuts();
  useCollabSetup();

  const hierarchyPanelOpen  = useStore((s) => s.hierarchyPanelOpen);
  const propertiesPanelOpen = useStore((s) => s.propertiesPanelOpen);
  const assetPanelOpen      = useStore((s) => s.assetPanelOpen);

  return (
    <div className="h-screen w-screen bg-[#0e0e1a] text-white flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <Toolbar />
        </div>
        <div className="pr-3 flex items-center gap-2 h-12 border-b border-[#2a2a3e] bg-[#12121e] flex-shrink-0">
          <PresenceAvatars />
        </div>
      </div>

      {/* Main layout: hierarchy | canvas | properties */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: hierarchy + assets */}
        {hierarchyPanelOpen && (
          <div className="w-56 flex-shrink-0 bg-[#14142a] border-r border-[#2a2a3e] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden min-h-0">
              <HierarchyPanel />
            </div>
            {assetPanelOpen && (
              <>
                <div className="h-px bg-[#2a2a3e]" />
                <div className="h-56 flex-shrink-0 overflow-hidden">
                  <AssetPanel />
                </div>
              </>
            )}
          </div>
        )}

        {/* Center: 3D canvas */}
        <div className="flex-1 relative overflow-hidden">
          <SceneCanvas />

          {/* Keyboard shortcut hints */}
          <div className="absolute bottom-3 left-3 flex gap-2 pointer-events-none">
            {[['Q', 'Select'], ['G', 'Move'], ['R', 'Rotate'], ['S', 'Scale'], ['Del', 'Delete'], ['⌘K', 'AI']].map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
                <kbd className="text-[9px] text-gray-400 font-mono bg-white/10 px-1 rounded">{key}</kbd>
                <span className="text-[9px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: properties */}
        {propertiesPanelOpen && (
          <div className="w-60 flex-shrink-0 bg-[#14142a] border-l border-[#2a2a3e] overflow-hidden">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* AI command bar modal */}
      <AICommandBar />
    </div>
  );
}
