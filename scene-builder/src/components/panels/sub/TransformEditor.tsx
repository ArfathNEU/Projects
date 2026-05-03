import { useStore } from '@/store';
import type { Vec3 } from '@/types/scene';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';

interface Props {
  objectId: string;
}

function Vec3Input({ label, value, onChange }: { label: string; value: Vec3; onChange: (v: Vec3) => void }) {
  const axes = ['X', 'Y', 'Z'] as const;
  return (
    <div className="mb-2">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {axes.map((axis, i) => (
          <div key={axis} className="flex items-center gap-1">
            <span className="text-xs text-gray-500 w-3">{axis}</span>
            <input
              type="number"
              step={label === 'Scale' ? 0.1 : 0.01}
              value={parseFloat(value[i].toFixed(4))}
              onChange={(e) => {
                const v = [...value] as Vec3;
                v[i] = parseFloat(e.target.value) || 0;
                onChange(v);
              }}
              className="w-full bg-[#1e1e2e] border border-[#3a3a5c] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-blue-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransformEditor({ objectId }: Props) {
  const obj = useStore((s) => s.scene.objects[objectId]);
  const updateTransform = useStore((s) => s.updateTransform);

  if (!obj) return null;

  const update = (field: 'position' | 'rotation' | 'scale', value: Vec3) => {
    updateTransform(objectId, { [field]: value });
    syncObjectToYjs({ ...obj, transform: { ...obj.transform, [field]: value } });
  };

  return (
    <div className="px-3 py-2">
      <Vec3Input label="Position" value={obj.transform.position} onChange={(v) => update('position', v)} />
      <Vec3Input label="Rotation" value={obj.transform.rotation} onChange={(v) => update('rotation', v)} />
      <Vec3Input label="Scale"    value={obj.transform.scale}    onChange={(v) => update('scale', v)} />
    </div>
  );
}
