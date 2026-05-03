import { useStore } from '@/store';
import type { MaterialDescriptor } from '@/types/scene';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';

interface Props { objectId: string }

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-300">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-blue-400"
      />
    </div>
  );
}

export default function MaterialEditor({ objectId }: Props) {
  const obj = useStore((s) => s.scene.objects[objectId]);
  const updateMaterial = useStore((s) => s.updateMaterial);

  if (!obj || obj.type !== 'mesh') return null;

  const update = (patch: Partial<MaterialDescriptor>) => {
    updateMaterial(objectId, patch);
    syncObjectToYjs({ ...obj, material: { ...obj.material, ...patch } });
  };

  return (
    <div className="px-3 py-2 space-y-1">
      <div className="mb-2">
        <label className="text-xs text-gray-400 block mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={obj.material.color} onChange={(e) => update({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
          <input type="text" value={obj.material.color} onChange={(e) => update({ color: e.target.value })}
            className="flex-1 bg-[#1e1e2e] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      <div className="mb-2">
        <label className="text-xs text-gray-400 block mb-1">Emissive</label>
        <div className="flex items-center gap-2">
          <input type="color" value={obj.material.emissive} onChange={(e) => update({ emissive: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
          <input type="text" value={obj.material.emissive} onChange={(e) => update({ emissive: e.target.value })}
            className="flex-1 bg-[#1e1e2e] border border-[#3a3a5c] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      <SliderRow label="Roughness" value={obj.material.roughness} min={0} max={1} step={0.01}
        onChange={(v) => update({ roughness: v })} />
      <SliderRow label="Metalness" value={obj.material.metalness} min={0} max={1} step={0.01}
        onChange={(v) => update({ metalness: v })} />
      <SliderRow label="Emissive Intensity" value={obj.material.emissiveIntensity} min={0} max={5} step={0.05}
        onChange={(v) => update({ emissiveIntensity: v })} />
      <SliderRow label="Opacity" value={obj.material.opacity} min={0} max={1} step={0.01}
        onChange={(v) => update({ opacity: v, transparent: v < 1 })} />

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400">Wireframe</span>
        <button
          onClick={() => update({ wireframe: !obj.material.wireframe })}
          className={`w-10 h-5 rounded-full transition-colors ${obj.material.wireframe ? 'bg-blue-500' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${obj.material.wireframe ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    </div>
  );
}
