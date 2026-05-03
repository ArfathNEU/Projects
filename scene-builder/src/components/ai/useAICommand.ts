import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { buildSceneContext } from './scenePromptBuilder';
import { createMeshObject, createLightObject } from '@/lib/objectFactory';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';
import type { AICommandResponse, AISceneOperation } from '@/types/ai';
import type { SceneObject } from '@/types/scene';

function deepMergeObject(base: SceneObject, partial: Partial<SceneObject>): SceneObject {
  return {
    ...base,
    ...partial,
    id: base.id,
    parentId: base.parentId,
    childIds: base.childIds,
    transform: {
      ...base.transform,
      ...(partial.transform ?? {}),
    },
    geometry: {
      ...base.geometry,
      ...(partial.geometry ?? {}),
      params: {
        ...base.geometry.params,
        ...(partial.geometry?.params ?? {}),
      },
    },
    material: {
      ...base.material,
      ...(partial.material ?? {}),
    },
    light: partial.light
      ? { ...(base.light ?? {}), ...partial.light } as SceneObject['light']
      : base.light,
    visible: partial.visible ?? base.visible,
    locked: partial.locked ?? base.locked,
    metadata: { ...base.metadata, ...(partial.metadata ?? {}) },
  };
}

export function useAICommand() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [lastExplanation, setLastExplanation] = useState('');

  const addObject    = useStore((s) => s.addObject);
  const updateObject = useStore((s) => s.updateObject);
  const removeObject = useStore((s) => s.removeObject);
  const pushHistory  = useStore((s) => s.pushHistory);

  const execute = useCallback(async (prompt: string) => {
    setLoading(true);
    setError('');
    try {
      // Read scene at call time, not render time
      const currentScene = useStore.getState().scene;

      pushHistory(currentScene);

      const workerUrl = import.meta.env.VITE_WORKER_URL ?? '';
      const res = await fetch(`${workerUrl}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          sceneContext: buildSceneContext(currentScene),
        }),
      });

      if (!res.ok) throw new Error(`AI request failed: ${res.statusText}`);
      const data = await res.json() as AICommandResponse;

      if (!data.operations || data.operations.length === 0) {
        setLastExplanation(data.explanation || 'No changes were made.');
        return;
      }

      for (const op of data.operations) {
        if (op.op === 'add' && op.object) {
          const base = op.object.type === 'light'
            ? createLightObject(op.object.light?.type ?? 'directional')
            : createMeshObject(op.object.geometry?.type ?? 'box');
          const merged = deepMergeObject(base, op.object);
          addObject(merged);
          syncObjectToYjs(merged);

        } else if (op.op === 'update' && op.objectId && op.object) {
          const existing = useStore.getState().scene.objects[op.objectId];
          if (!existing) continue;
          const updated = deepMergeObject(existing, op.object);
          updateObject(op.objectId, op.object);
          syncObjectToYjs(updated);

        } else if (op.op === 'remove' && op.objectId) {
          removeObject(op.objectId);
        }
      }

      setLastExplanation(data.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [addObject, updateObject, removeObject, pushHistory]);

  return { execute, loading, error, lastExplanation };
}
