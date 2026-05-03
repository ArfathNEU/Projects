import * as THREE from 'three';

export interface GeometryData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  index: Uint32Array | null;
}

export function generateGeometry(type: string, params: Record<string, number>): GeometryData {
  let geo: THREE.BufferGeometry;

  switch (type) {
    case 'sphere':
      geo = new THREE.SphereGeometry(params.radius ?? 0.5, params.widthSegments ?? 32, params.heightSegments ?? 16);
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(params.radiusTop ?? 0.5, params.radiusBottom ?? 0.5, params.height ?? 1, params.radialSegments ?? 32);
      break;
    case 'cone':
      geo = new THREE.ConeGeometry(params.radius ?? 0.5, params.height ?? 1, params.radialSegments ?? 32);
      break;
    case 'torus':
      geo = new THREE.TorusGeometry(params.radius ?? 0.5, params.tube ?? 0.2, params.radialSegments ?? 16, params.tubularSegments ?? 100);
      break;
    case 'plane':
      geo = new THREE.PlaneGeometry(params.width ?? 2, params.height ?? 2);
      break;
    case 'capsule':
      geo = new THREE.CapsuleGeometry(params.radius ?? 0.3, params.length ?? 0.8, params.capSegments ?? 4, params.radialSegments ?? 8);
      break;
    default:
      geo = new THREE.BoxGeometry(params.width ?? 1, params.height ?? 1, params.depth ?? 1);
  }

  geo.computeVertexNormals();

  const positions = (geo.attributes.position.array as Float32Array).slice();
  const normals   = (geo.attributes.normal?.array as Float32Array | undefined)?.slice() ?? new Float32Array(0);
  const uvs       = (geo.attributes.uv?.array as Float32Array | undefined)?.slice() ?? new Float32Array(0);
  const indexArr  = geo.index ? (geo.index.array as Uint32Array).slice() : null;

  geo.dispose();
  return { positions, normals, uvs, index: indexArr };
}
