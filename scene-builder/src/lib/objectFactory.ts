import { nanoid } from './nanoid';
import type {
  SceneObject,
  SceneObjectType,
  GeometryType,
  GeometryDescriptor,
  LightDescriptor,
} from '@/types/scene';
import {
  DEFAULT_TRANSFORM,
  DEFAULT_MATERIAL,
  DEFAULT_GEOMETRY,
} from '@/types/scene';

const GEOMETRY_DEFAULTS: Record<GeometryType, GeometryDescriptor> = {
  box:      { type: 'box',      params: { width: 1, height: 1, depth: 1 } },
  sphere:   { type: 'sphere',   params: { radius: 0.5, widthSegments: 32, heightSegments: 16 } },
  cylinder: { type: 'cylinder', params: { radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 32 } },
  cone:     { type: 'cone',     params: { radius: 0.5, height: 1, radialSegments: 32 } },
  torus:    { type: 'torus',    params: { radius: 0.5, tube: 0.2, radialSegments: 16, tubularSegments: 100 } },
  plane:    { type: 'plane',    params: { width: 2, height: 2 } },
  capsule:  { type: 'capsule',  params: { radius: 0.3, length: 0.8, capSegments: 4, radialSegments: 8 } },
  custom:   { type: 'custom',   params: {} },
};

export function createMeshObject(geoType: GeometryType = 'box', overrides: Partial<SceneObject> = {}): SceneObject {
  const id = nanoid();
  return {
    id,
    type: 'mesh',
    name: `${geoType.charAt(0).toUpperCase() + geoType.slice(1)}`,
    parentId: null,
    childIds: [],
    transform: { ...DEFAULT_TRANSFORM },
    geometry: GEOMETRY_DEFAULTS[geoType],
    material: { ...DEFAULT_MATERIAL },
    visible: true,
    locked: false,
    metadata: {},
    ...overrides,
  };
}

export function createLightObject(lightType: LightDescriptor['type'] = 'directional'): SceneObject {
  const id = nanoid();
  const light: LightDescriptor = {
    type: lightType,
    color: '#ffffff',
    intensity: 1,
    castShadow: lightType !== 'ambient' && lightType !== 'hemisphere',
    distance: lightType === 'point' ? 10 : undefined,
    angle: lightType === 'spot' ? Math.PI / 4 : undefined,
    penumbra: lightType === 'spot' ? 0.1 : undefined,
    decay: lightType === 'point' || lightType === 'spot' ? 2 : undefined,
    groundColor: lightType === 'hemisphere' ? '#8888ff' : undefined,
  };
  return {
    id,
    type: 'light',
    name: `${lightType.charAt(0).toUpperCase() + lightType.slice(1)} Light`,
    parentId: null,
    childIds: [],
    transform: {
      position: [0, 3, 0],
      rotation: [-Math.PI / 4, 0, 0],
      scale: [1, 1, 1],
    },
    geometry: DEFAULT_GEOMETRY,
    material: { ...DEFAULT_MATERIAL },
    light,
    visible: true,
    locked: false,
    metadata: {},
  };
}

export function createGroupObject(): SceneObject {
  const id = nanoid();
  return {
    id,
    type: 'group',
    name: 'Group',
    parentId: null,
    childIds: [],
    transform: { ...DEFAULT_TRANSFORM },
    geometry: DEFAULT_GEOMETRY,
    material: { ...DEFAULT_MATERIAL },
    visible: true,
    locked: false,
    metadata: {},
  };
}
