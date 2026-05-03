import * as Y from 'yjs';
import { ydoc, yObjects, yRootIds } from '@/collab/yjsDoc';
import type { SceneObject } from '@/types/scene';

// Single flag prevents echo loops between Yjs→Zustand and Zustand→Yjs
let isApplyingRemoteUpdate = false;

// ─── Zustand → Yjs ───────────────────────────────────────────────────────────

export function syncObjectToYjs(obj: SceneObject) {
  if (isApplyingRemoteUpdate) return;
  ydoc.transact(() => {
    let yObj = yObjects.get(obj.id);
    if (!yObj) {
      yObj = new Y.Map();
      yObjects.set(obj.id, yObj);
    }
    yObj.set('type', obj.type);
    yObj.set('name', obj.name);
    yObj.set('parentId', obj.parentId);
    yObj.set('childIds', obj.childIds);
    yObj.set('transform', obj.transform);
    yObj.set('geometry', obj.geometry);
    yObj.set('material', obj.material);
    yObj.set('light', obj.light ?? null);
    yObj.set('visible', obj.visible);
    yObj.set('locked', obj.locked);
    yObj.set('metadata', obj.metadata);
  });
}

export function syncRootIdsToYjs(rootIds: string[]) {
  if (isApplyingRemoteUpdate) return;
  ydoc.transact(() => {
    yRootIds.delete(0, yRootIds.length);
    yRootIds.insert(0, rootIds);
  });
}

export function removeObjectFromYjs(id: string) {
  if (isApplyingRemoteUpdate) return;
  ydoc.transact(() => {
    yObjects.delete(id);
  });
}

// ─── Yjs → Zustand ───────────────────────────────────────────────────────────

function yMapToSceneObject(id: string, yObj: Y.Map<unknown>): SceneObject {
  return {
    id,
    type:      (yObj.get('type')      as SceneObject['type'])      ?? 'mesh',
    name:      (yObj.get('name')      as string)                   ?? id,
    parentId:  (yObj.get('parentId')  as string | null)            ?? null,
    childIds:  (yObj.get('childIds')  as string[])                 ?? [],
    transform: (yObj.get('transform') as SceneObject['transform']) ?? { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] },
    geometry:  (yObj.get('geometry')  as SceneObject['geometry'])  ?? { type: 'box', params: {} },
    material:  (yObj.get('material')  as SceneObject['material'])  ?? { color: '#ffffff', roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    light:     (yObj.get('light')     as SceneObject['light'])     ?? undefined,
    visible:   (yObj.get('visible')   as boolean)                  ?? true,
    locked:    (yObj.get('locked')    as boolean)                  ?? false,
    metadata:  (yObj.get('metadata')  as Record<string,unknown>)   ?? {},
  };
}

type StoreApi = {
  getState: () => {
    upsertObject: (obj: SceneObject) => void;
    removeObject: (id: string) => void;
    scene: { rootIds: string[] };
  };
};

export function subscribeYjsToStore(store: StoreApi) {
  const observedIds = new Set<string>();

  function observeDeep(id: string, yObj: Y.Map<unknown>) {
    if (observedIds.has(id)) return;
    observedIds.add(id);
    yObj.observe(() => {
      if (!isApplyingRemoteUpdate) {
        isApplyingRemoteUpdate = true;
        try {
          store.getState().upsertObject(yMapToSceneObject(id, yObj));
        } finally {
          isApplyingRemoteUpdate = false;
        }
      }
    });
  }

  yObjects.observe((event) => {
    isApplyingRemoteUpdate = true;
    try {
      event.changes.keys.forEach((change, id) => {
        if (change.action === 'add' || change.action === 'update') {
          const yObj = yObjects.get(id);
          if (yObj) {
            store.getState().upsertObject(yMapToSceneObject(id, yObj));
            observeDeep(id, yObj);
          }
        } else if (change.action === 'delete') {
          observedIds.delete(id);
          store.getState().removeObject(id);
        }
      });
    } finally {
      isApplyingRemoteUpdate = false;
    }
  });

  yObjects.forEach((yObj, id) => observeDeep(id, yObj));
}
