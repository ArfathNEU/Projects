import { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store';
import type { SceneObject as ISceneObject } from '@/types/scene';

interface Props {
  obj: ISceneObject;
  isSelected: boolean;
  isHovered: boolean;
}

function buildGeometry(obj: ISceneObject): THREE.BufferGeometry {
  const p = obj.geometry.params;
  switch (obj.geometry.type) {
    case 'sphere':   return new THREE.SphereGeometry(p.radius ?? 0.5, p.widthSegments ?? 32, p.heightSegments ?? 16);
    case 'cylinder': return new THREE.CylinderGeometry(p.radiusTop ?? 0.5, p.radiusBottom ?? 0.5, p.height ?? 1, p.radialSegments ?? 32);
    case 'cone':     return new THREE.ConeGeometry(p.radius ?? 0.5, p.height ?? 1, p.radialSegments ?? 32);
    case 'torus':    return new THREE.TorusGeometry(p.radius ?? 0.5, p.tube ?? 0.2, p.radialSegments ?? 16, p.tubularSegments ?? 100);
    case 'plane':    return new THREE.PlaneGeometry(p.width ?? 2, p.height ?? 2);
    case 'capsule':  return new THREE.CapsuleGeometry(p.radius ?? 0.3, p.length ?? 0.8, p.capSegments ?? 4, p.radialSegments ?? 8);
    default:         return new THREE.BoxGeometry(p.width ?? 1, p.height ?? 1, p.depth ?? 1);
  }
}

export default function SceneObject({ obj, isSelected, isHovered }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectObject = useStore((s) => s.selectObject);
  const setHovered   = useStore((s) => s.setHovered);

  const geometry = useMemo(() => buildGeometry(obj), [obj.geometry.type, JSON.stringify(obj.geometry.params)]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(obj.material.color),
        roughness: obj.material.roughness,
        metalness: obj.material.metalness,
        emissive: new THREE.Color(obj.material.emissive),
        emissiveIntensity: obj.material.emissiveIntensity,
        opacity: obj.material.opacity,
        transparent: obj.material.transparent,
        wireframe: obj.material.wireframe,
      }),
    [
      obj.material.color,
      obj.material.roughness,
      obj.material.metalness,
      obj.material.emissive,
      obj.material.emissiveIntensity,
      obj.material.opacity,
      obj.material.transparent,
      obj.material.wireframe,
    ]
  );
  useEffect(() => () => { material.dispose(); }, [material]);

  const onClick = useCallback(
    (e: THREE.Event) => {
      (e as unknown as MouseEvent & { stopPropagation: () => void }).stopPropagation();
      selectObject(obj.id, (e as unknown as MouseEvent).shiftKey);
    },
    [obj.id, selectObject]
  );

  const onPointerOver = useCallback(
    (e: THREE.Event) => {
      (e as unknown as MouseEvent & { stopPropagation: () => void }).stopPropagation();
      setHovered(obj.id);
      document.body.style.cursor = 'pointer';
    },
    [obj.id, setHovered]
  );

  const onPointerOut = useCallback(() => {
    setHovered(null);
    document.body.style.cursor = 'default';
  }, [setHovered]);

  if (!obj.visible || obj.type === 'group') return null;
  if (obj.type === 'light') return null; // lights rendered separately

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={obj.transform.position}
      rotation={obj.transform.rotation}
      scale={obj.transform.scale}
      onClick={onClick as never}
      onPointerOver={onPointerOver as never}
      onPointerOut={onPointerOut as never}
      userData={{ id: obj.id, selected: isSelected }}
      castShadow
      receiveShadow
    >
      {/* Hover / selection highlight via emissive boost */}
      {(isSelected || isHovered) && (
        <meshStandardMaterial
          attach="material"
          color={obj.material.color}
          roughness={obj.material.roughness}
          metalness={obj.material.metalness}
          emissive={isSelected ? '#ffaa00' : '#ffffff'}
          emissiveIntensity={isSelected ? 0.15 : 0.05}
          opacity={obj.material.opacity}
          transparent={obj.material.transparent}
          wireframe={obj.material.wireframe}
        />
      )}
    </mesh>
  );
}
