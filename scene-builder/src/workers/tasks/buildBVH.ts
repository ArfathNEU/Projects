import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const bvhCache = new Map<string, MeshBVH>();

export interface BVHResult {
  objectId: string;
  serialized: string;
}

export function buildBVH(objectId: string, positions: Float32Array, index: Uint32Array | null): BVHResult {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (index) geo.setIndex(new THREE.BufferAttribute(index, 1));

  const bvh = new MeshBVH(geo);
  bvhCache.set(objectId, bvh);

  return { objectId, serialized: JSON.stringify(MeshBVH.serialize(bvh)) };
}

export function hasBVH(objectId: string): boolean {
  return bvhCache.has(objectId);
}
