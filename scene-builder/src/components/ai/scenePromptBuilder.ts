import type { SceneGraph } from '@/types/scene';

export function buildSceneContext(scene: SceneGraph): string {
  const objects = Object.values(scene.objects);
  const summary = objects.map((o) => {
    const pos = o.transform.position.map((v) => v.toFixed(2)).join(', ');
    const scl = o.transform.scale.map((v) => v.toFixed(2)).join(', ');
    if (o.type === 'light') {
      return `  - [id=${o.id}] ${o.name} [${o.type}/${o.light?.type}] at (${pos})`;
    }
    return `  - [id=${o.id}] ${o.name} [${o.type}/${o.geometry.type}] color=${o.material.color} pos=(${pos}) scale=(${scl})`;
  }).join('\n');

  return `Scene: "${scene.name}" with ${objects.length} objects:\n${summary || '  (empty)'}`;
}
