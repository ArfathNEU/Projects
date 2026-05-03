import { useState } from 'react';
import { useStore, useSelectedIds } from '@/store';
import TransformEditor from './sub/TransformEditor';
import MaterialEditor from './sub/MaterialEditor';
import LightEditor from './sub/LightEditor';
import TextureGenerator from './sub/TextureGenerator';
import clsx from 'clsx';

type Tab = 'transform' | 'material' | 'texture';

export default function PropertiesPanel() {
  const [tab, setTab] = useState<Tab>('transform');
  const selectedIds = useSelectedIds();
  const primaryId   = selectedIds[0];
  const obj         = useStore((s) => primaryId ? s.scene.objects[primaryId] : null);
  const updateObject = useStore((s) => s.updateObject);

  if (!primaryId || !obj) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-[#2a2a3e]">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-600">Select an object</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'transform', label: 'Transform' },
    ...(obj.type === 'mesh' ? [{ id: 'material' as Tab, label: 'Material' }] : []),
    ...(obj.type === 'light' ? [{ id: 'material' as Tab, label: 'Light' }] : []),
    ...(obj.type === 'mesh' ? [{ id: 'texture' as Tab, label: 'Texture' }] : []),
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#2a2a3e]">
        <input
          value={obj.name}
          onChange={(e) => updateObject(primaryId, { name: e.target.value })}
          className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none border-b border-transparent focus:border-blue-400 pb-0.5"
        />
        <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{obj.type}</div>
      </div>

      <div className="flex border-b border-[#2a2a3e]">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex-1 text-xs py-1.5 transition-colors',
              tab === id ? 'text-blue-400 border-b-2 border-blue-400 -mb-px' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'transform' && <TransformEditor objectId={primaryId} />}
        {tab === 'material' && obj.type === 'mesh' && <MaterialEditor objectId={primaryId} />}
        {tab === 'material' && obj.type === 'light' && <LightEditor objectId={primaryId} />}
        {tab === 'texture' && obj.type === 'mesh' && <TextureGenerator objectId={primaryId} />}
      </div>
    </div>
  );
}
