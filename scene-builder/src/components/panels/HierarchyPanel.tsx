import { useState } from 'react';
import { useStore, useObjects, useSelectedIds } from '@/store';
import { removeObjectFromYjs } from '@/store/middleware/yjsMiddleware';
import {
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, Trash2,
  Box, Circle, Sun, Layers, FolderOpen
} from 'lucide-react';
import type { SceneObject } from '@/types/scene';
import clsx from 'clsx';

const TYPE_ICONS: Record<string, React.ElementType> = {
  mesh:   Box,
  light:  Sun,
  group:  FolderOpen,
  camera: Layers,
};

function TreeNode({ id, depth = 0 }: { id: string; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const obj        = useStore((s) => s.scene.objects[id]);
  const selectedIds = useSelectedIds();
  const selectObject   = useStore((s) => s.selectObject);
  const updateObject   = useStore((s) => s.updateObject);
  const removeObject   = useStore((s) => s.removeObject);
  const duplicateObject = useStore((s) => s.duplicateObject);

  if (!obj) return null;

  const isSelected = selectedIds.includes(id);
  const hasChildren = obj.childIds.length > 0;
  const Icon = TYPE_ICONS[obj.type] ?? Box;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeObject(id);
    removeObjectFromYjs(id);
  };

  const handleToggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(id, { visible: !obj.visible });
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(id, { locked: !obj.locked });
  };

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={clsx(
          'group flex items-center gap-1 py-0.5 pr-1 cursor-pointer rounded mx-1',
          isSelected ? 'bg-blue-600/30 text-white' : 'text-gray-300 hover:bg-white/5'
        )}
        onClick={(e) => selectObject(id, e.shiftKey)}
      >
        <button
          className="w-4 h-4 flex items-center justify-center text-gray-500"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {hasChildren ? (expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />) : null}
        </button>

        <Icon size={12} className={isSelected ? 'text-blue-300' : 'text-gray-400'} />
        <span className={clsx('flex-1 text-xs truncate', !obj.visible && 'opacity-40')}>{obj.name}</span>

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={handleToggleVisible} className="p-0.5 hover:text-white text-gray-500">
            {obj.visible ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
          <button onClick={handleToggleLock} className="p-0.5 hover:text-white text-gray-500">
            {obj.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); duplicateObject(id); }} className="p-0.5 hover:text-white text-gray-500 text-[10px] font-bold">
            ⎘
          </button>
          <button onClick={handleDelete} className="p-0.5 hover:text-red-400 text-gray-500">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {obj.childIds.map((childId) => (
            <TreeNode key={childId} id={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyPanel() {
  const scene  = useStore((s) => s.scene);
  const objects = useObjects();

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#2a2a3e] flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Scene</span>
        <span className="text-xs text-gray-500">{Object.keys(objects).length} objects</span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {scene.rootIds.length === 0 ? (
          <div className="text-xs text-gray-600 text-center py-6 px-3">
            No objects yet.<br />Use the asset panel to add primitives.
          </div>
        ) : (
          scene.rootIds.map((id) => <TreeNode key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
