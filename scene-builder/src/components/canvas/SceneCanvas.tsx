import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Environment } from '@react-three/drei';
import { EffectComposer, Vignette, Bloom } from '@react-three/postprocessing';
import { useStore } from '@/store';
import SceneObjects from './SceneObjects';
import SceneLights from './SceneLights';
import TransformController from './TransformController';
import Grid from './Grid';

function PostProcessing() {
  const { aoEnabled, fogEnabled, shadersEnabled } = useStore(
    useShallow((s) => ({ aoEnabled: s.aoEnabled, fogEnabled: s.fogEnabled, shadersEnabled: s.shadersEnabled }))
  );

  if (!shadersEnabled) return null;

  return (
    <EffectComposer>
      {aoEnabled ? (
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.025} intensity={0.3} />
      ) : <></>}
      <Vignette eskil={false} offset={0.1} darkness={0.4} />
    </EffectComposer>
  );
}

export default function SceneCanvas() {
  const showStats = useStore((s) => s.showStats);
  const deselectAll = useStore((s) => s.deselectAll);
  const orbitRef = useRef(null);

  return (
    <Canvas
      shadows
      camera={{ position: [5, 4, 8], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: '#1a1a2e' }}
      onPointerMissed={deselectAll}
    >
      <Suspense fallback={null}>
        {/* Lighting defaults — user can override via light objects */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[8, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <Environment preset="city" />

        <SceneLights />
        <SceneObjects />
        <TransformController />
        <Grid />

        <OrbitControls
          ref={orbitRef}
          makeDefault
          minDistance={1}
          maxDistance={100}
          enableDamping
          dampingFactor={0.08}
        />

        <PostProcessing />
        {showStats && <Stats />}
      </Suspense>
    </Canvas>
  );
}
