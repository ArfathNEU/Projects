import { useStore } from '@/store';
import type { LightDescriptor } from '@/types/scene';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';

interface Props { objectId: string }

export default function LightEditor({ objectId }: Props) {
  const obj = useStore((s) => s.scene.objects[objectId]);
  const updateObject = useStore((s) => s.updateObject);

  if (!obj?.light) return null;

  const update = (patch: Partial<LightDescriptor>) => {
    const light = { ...obj.light!, ...patch };
    updateObject(objectId, { light });
    syncObjectToYjs({ ...obj, light });
  };

  const { type, color, intensity, castShadow, distance, angle, penumbra, decay, groundColor } = obj.light;

  return (
    <div className="px-3 py-2 space-y-2">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Type</label>
        <select value={type} onChange={(e) => update({ type: e.target.value as LightDescriptor['type'] })}
          className="w-full bg-[#1e1e2e] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white focus:outline-none">
          {['directional','point','spot','ambient','hemisphere'].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Color</label>
        <input type="color" value={color} onChange={(e) => update({ color: e.target.value })}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Intensity</span>
          <span className="text-xs text-gray-300">{intensity.toFixed(2)}</span>
        </div>
        <input type="range" min={0} max={10} step={0.1} value={intensity}
          onChange={(e) => update({ intensity: parseFloat(e.target.value) })}
          className="w-full h-1.5 accent-blue-400" />
      </div>

      {(type === 'point' || type === 'spot') && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Distance</span>
            <span className="text-xs text-gray-300">{(distance ?? 10).toFixed(1)}</span>
          </div>
          <input type="range" min={0} max={50} step={0.5} value={distance ?? 10}
            onChange={(e) => update({ distance: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-blue-400" />
        </div>
      )}

      {type === 'spot' && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Angle</span>
            <span className="text-xs text-gray-300">{((angle ?? Math.PI / 4) * 180 / Math.PI).toFixed(0)}°</span>
          </div>
          <input type="range" min={0} max={Math.PI / 2} step={0.01} value={angle ?? Math.PI / 4}
            onChange={(e) => update({ angle: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-blue-400" />
        </div>
      )}

      {type === 'hemisphere' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Ground</label>
          <input type="color" value={groundColor ?? '#8888ff'} onChange={(e) => update({ groundColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
        </div>
      )}

      {type !== 'ambient' && type !== 'hemisphere' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Cast Shadow</span>
          <button onClick={() => update({ castShadow: !castShadow })}
            className={`w-10 h-5 rounded-full transition-colors ${castShadow ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${castShadow ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
