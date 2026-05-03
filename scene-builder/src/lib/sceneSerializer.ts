import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { SceneGraph, SceneObject } from '@/types/scene';

function buildThreeObject(obj: SceneObject): THREE.Object3D | null {
  if (!obj.visible) return null;

  if (obj.type === 'group') {
    const group = new THREE.Group();
    group.name = obj.name;
    group.position.set(...obj.transform.position);
    group.rotation.set(...obj.transform.rotation);
    group.scale.set(...obj.transform.scale);
    return group;
  }

  if (obj.type === 'mesh') {
    let geo: THREE.BufferGeometry;
    const p = obj.geometry.params;
    switch (obj.geometry.type) {
      case 'sphere':   geo = new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments); break;
      case 'cylinder': geo = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments); break;
      case 'cone':     geo = new THREE.ConeGeometry(p.radius, p.height, p.radialSegments); break;
      case 'torus':    geo = new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments); break;
      case 'plane':    geo = new THREE.PlaneGeometry(p.width, p.height); break;
      case 'capsule':  geo = new THREE.CapsuleGeometry(p.radius, p.length, p.capSegments, p.radialSegments); break;
      default:         geo = new THREE.BoxGeometry(p.width ?? 1, p.height ?? 1, p.depth ?? 1);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(obj.material.color),
      roughness: obj.material.roughness,
      metalness: obj.material.metalness,
      emissive: new THREE.Color(obj.material.emissive),
      emissiveIntensity: obj.material.emissiveIntensity,
      opacity: obj.material.opacity,
      transparent: obj.material.transparent,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = obj.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(...obj.transform.position);
    mesh.rotation.set(...obj.transform.rotation);
    mesh.scale.set(...obj.transform.scale);
    return mesh;
  }

  return null;
}

export async function exportToGLTF(scene: SceneGraph): Promise<ArrayBuffer> {
  const root = new THREE.Scene();
  root.name = scene.name;

  const nodeMap = new Map<string, THREE.Object3D>();

  // Build Three.js objects
  Object.values(scene.objects).forEach((obj) => {
    const node = buildThreeObject(obj);
    if (node) nodeMap.set(obj.id, node);
  });

  // Wire parent-child hierarchy
  Object.values(scene.objects).forEach((obj) => {
    const node = nodeMap.get(obj.id);
    if (!node) return;
    if (obj.parentId && nodeMap.has(obj.parentId)) {
      nodeMap.get(obj.parentId)!.add(node);
    } else {
      root.add(node);
    }
  });

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else resolve(new TextEncoder().encode(JSON.stringify(result)).buffer);
      },
      reject,
      { binary: true }
    );
  });
}

export function downloadBlob(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
