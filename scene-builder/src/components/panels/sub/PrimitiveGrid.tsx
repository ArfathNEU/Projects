import { useStore } from '@/store';
import { createMeshObject, createLightObject } from '@/lib/objectFactory';
import { syncObjectToYjs, syncRootIdsToYjs } from '@/store/middleware/yjsMiddleware';
import type { GeometryType, LightDescriptor } from '@/types/scene';
import { Box, Circle, Cylinder, Triangle, RotateCcw, Layers, Sun, Zap, Lightbulb } from 'lucide-react';

const PRIMITIVES: { type: GeometryType; label: string; Icon: React.ElementType }[] = [
  { type: 'box',      label: 'Box',      Icon: Box },
  { type: 'sphere',   label: 'Sphere',   Icon: Circle },
  { type: 'cylinder', label: 'Cylinder', Icon: Cylinder },
  { type: 'cone',     label: 'Cone',     Icon: Triangle },
  { type: 'torus',    label: 'Torus',    Icon: RotateCcw },
  { type: 'plane',    label: 'Plane',    Icon: Layers },
  { type: 'capsule',  label: 'Capsule',  Icon: Cylinder },
];

const LIGHTS: { type: LightDescriptor['type']; label: string; Icon: React.ElementType }[] = [
  { type: 'directional', label: 'Directional', Icon: Sun },
  { type: 'point',       label: 'Point',       Icon: Lightbulb },
  { type: 'spot',        label: 'Spot',        Icon: Zap },
  { type: 'ambient',     label: 'Ambient',     Icon: Sun },
];

export default function PrimitiveGrid() {
  const addObject = useStore((s) => s.addObject);
  const scene     = useStore((s) => s.scene);

  const addPrimitive = (type: GeometryType) => {
    const obj = createMeshObject(type);
    addObject(obj);
    syncObjectToYjs(obj);
    syncRootIdsToYjs([...scene.rootIds, obj.id]);
  };

  const addLight = (type: LightDescriptor['type']) => {
    const obj = createLightObject(type);
    addObject(obj);
    syncObjectToYjs(obj);
    syncRootIdsToYjs([...scene.rootIds, obj.id]);
  };

  return (
    <div className="p-2">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Primitives</div>
      <div className="grid grid-cols-4 gap-1 mb-3">
        {PRIMITIVES.map(({ type, label, Icon }) => (
          <button
            key={type}
            onClick={() => addPrimitive(type)}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-[#2a2a3e] text-gray-300 hover:text-white transition-colors group"
            title={label}
          >
            <Icon size={16} className="text-blue-400 group-hover:text-blue-300" />
            <span className="text-[10px] truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Lights</div>
      <div className="grid grid-cols-4 gap-1">
        {LIGHTS.map(({ type, label, Icon }) => (
          <button
            key={type}
            onClick={() => addLight(type)}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-[#2a2a3e] text-gray-300 hover:text-white transition-colors group"
            title={label}
          >
            <Icon size={16} className="text-yellow-400 group-hover:text-yellow-300" />
            <span className="text-[10px] truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
