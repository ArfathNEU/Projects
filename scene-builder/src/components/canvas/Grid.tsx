import { Grid as DreiGrid } from '@react-three/drei';
import { useStore } from '@/store';

export default function Grid() {
  const showGrid = useStore((s) => s.showGrid);
  if (!showGrid) return null;
  return (
    <DreiGrid
      infiniteGrid
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#4a4a5a"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#6a6a8a"
      fadeDistance={30}
      fadeStrength={1}
    />
  );
}
