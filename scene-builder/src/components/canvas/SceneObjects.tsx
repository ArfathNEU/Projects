import { useObjects, useSelectedIds, useHoveredId } from '@/store';
import SceneObjectComponent from './SceneObject';

export default function SceneObjects() {
  const objects    = useObjects();
  const selectedIds = useSelectedIds();
  const hoveredId  = useHoveredId();

  return (
    <>
      {Object.values(objects)
        .filter((o) => o.type === 'mesh')
        .map((obj) => (
          <SceneObjectComponent
            key={obj.id}
            obj={obj}
            isSelected={selectedIds.includes(obj.id)}
            isHovered={hoveredId === obj.id}
          />
        ))}
    </>
  );
}
