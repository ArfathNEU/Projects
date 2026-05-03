export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export interface Transform {
  position: Vec3;
  rotation: Vec3; // Euler angles in radians
  scale: Vec3;
}

export type GeometryType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'
  | 'capsule'
  | 'custom';

export interface GeometryDescriptor {
  type: GeometryType;
  params: Record<string, number>;
}

export interface MaterialDescriptor {
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  textureUrl?: string;
  normalMapUrl?: string;
  wireframe: boolean;
}

export type LightType = 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';

export interface LightDescriptor {
  type: LightType;
  color: string;
  intensity: number;
  castShadow: boolean;
  distance?: number;     // point / spot
  angle?: number;        // spot
  penumbra?: number;     // spot
  decay?: number;        // point / spot
  groundColor?: string;  // hemisphere
}

export type SceneObjectType = 'mesh' | 'light' | 'group' | 'camera';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  name: string;
  parentId: string | null;
  childIds: string[];
  transform: Transform;
  geometry: GeometryDescriptor;
  material: MaterialDescriptor;
  light?: LightDescriptor;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, unknown>;
}

export interface SceneGraph {
  objects: Record<string, SceneObject>;
  rootIds: string[];
  version: number;
  name: string;
}

export const DEFAULT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export const DEFAULT_MATERIAL: MaterialDescriptor = {
  color: '#4a90d9',
  roughness: 0.5,
  metalness: 0.0,
  emissive: '#000000',
  emissiveIntensity: 0,
  opacity: 1,
  transparent: false,
  wireframe: false,
};

export const DEFAULT_GEOMETRY: GeometryDescriptor = {
  type: 'box',
  params: { width: 1, height: 1, depth: 1 },
};
