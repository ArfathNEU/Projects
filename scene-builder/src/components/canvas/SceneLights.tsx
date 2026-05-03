import { useObjects } from '@/store';
import type { SceneObject } from '@/types/scene';

function LightObject({ obj }: { obj: SceneObject }) {
  if (!obj.light || !obj.visible) return null;
  const { type, color, intensity, castShadow, distance, angle, penumbra, decay, groundColor } = obj.light;
  const pos = obj.transform.position;
  const rot = obj.transform.rotation;

  switch (type) {
    case 'directional':
      return (
        <directionalLight
          position={pos} rotation={rot}
          color={color} intensity={intensity}
          castShadow={castShadow}
          shadow-mapSize={[2048, 2048]}
        />
      );
    case 'point':
      return (
        <pointLight
          position={pos}
          color={color} intensity={intensity}
          distance={distance} decay={decay}
          castShadow={castShadow}
        />
      );
    case 'spot':
      return (
        <spotLight
          position={pos} rotation={rot}
          color={color} intensity={intensity}
          distance={distance} angle={angle} penumbra={penumbra} decay={decay}
          castShadow={castShadow}
          shadow-mapSize={[1024, 1024]}
        />
      );
    case 'ambient':
      return <ambientLight color={color} intensity={intensity} />;
    case 'hemisphere':
      return <hemisphereLight args={[color, groundColor ?? '#8888ff', intensity]} />;
    default:
      return null;
  }
}

export default function SceneLights() {
  const objects = useObjects();
  const lights = Object.values(objects).filter((o) => o.type === 'light');
  return (
    <>
      {lights.map((obj) => (
        <LightObject key={obj.id} obj={obj} />
      ))}
    </>
  );
}
