import { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, useSelectedIds } from '@/store';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';

export default function TransformController() {
  const selectedIds    = useSelectedIds();
  const activeTool     = useStore((s) => s.activeTool);
  const transformSpace = useStore((s) => s.transformSpace);
  const objects        = useStore((s) => s.scene.objects);
  const updateTransform = useStore((s) => s.updateTransform);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls       = useRef<any>(null);
  const dummyRef       = useRef<THREE.Object3D>(null);
  const { gl } = useThree();

  const primaryId = selectedIds[0];
  const primaryObj = primaryId ? objects[primaryId] : null;

  // Keep OrbitControls disabled while dragging transform handles
  useEffect(() => {
    if (!controls.current) return;
    const ctrl = controls.current;
    const onDragging = (e: { value: boolean }) => {
      // Propagate disable signal via custom event
      gl.domElement.dispatchEvent(new CustomEvent('transformdragging', { detail: e.value }));
    };
    ctrl.addEventListener('dragging-changed', onDragging as never);
    return () => ctrl.removeEventListener('dragging-changed', onDragging as never);
  }, [gl]);

  const mode = activeTool === 'select' ? 'translate' : activeTool;

  if (!primaryObj || activeTool === 'select') return null;

  const onObjectChange = () => {
    if (!dummyRef.current || !primaryId) return;
    const pos = dummyRef.current.position;
    const rot = dummyRef.current.rotation;
    const scl = dummyRef.current.scale;
    const transform = {
      position: [pos.x, pos.y, pos.z] as [number, number, number],
      rotation: [rot.x, rot.y, rot.z] as [number, number, number],
      scale:    [scl.x, scl.y, scl.z] as [number, number, number],
    };
    updateTransform(primaryId, transform);
    syncObjectToYjs({ ...primaryObj, transform });
  };

  return (
    <>
      {/* Invisible dummy object that TransformControls actually manipulates */}
      <object3D
        ref={dummyRef}
        position={primaryObj.transform.position}
        rotation={primaryObj.transform.rotation}
        scale={primaryObj.transform.scale}
      />
      <TransformControls
        ref={controls}
        object={dummyRef as never}
        mode={mode as 'translate' | 'rotate' | 'scale'}
        space={transformSpace}
        onObjectChange={onObjectChange}
        size={0.8}
      />
    </>
  );
}
