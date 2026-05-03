import type { StateCreator } from 'zustand';
import type { SceneObject, Transform, MaterialDescriptor, SceneGraph } from '@/types/scene';
import { nanoid } from '@/lib/nanoid';

export interface SceneSlice {
  scene: SceneGraph;
  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  upsertObject: (obj: SceneObject) => void;
  updateTransform: (id: string, transform: Partial<Transform>) => void;
  updateMaterial: (id: string, material: Partial<MaterialDescriptor>) => void;
  updateObject: (id: string, patch: Partial<SceneObject>) => void;
  setParent: (id: string, parentId: string | null) => void;
  duplicateObject: (id: string) => SceneObject | null;
  clearScene: () => void;
  setSceneName: (name: string) => void;
}

const emptyScene = (): SceneGraph => ({
  objects: {},
  rootIds: [],
  version: 0,
  name: 'Untitled Scene',
});

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (set, get) => ({
  scene: emptyScene(),

  addObject: (obj) => {
    set((state) => {
      const objects = { ...state.scene.objects, [obj.id]: obj };
      const rootIds = obj.parentId === null
        ? [...state.scene.rootIds, obj.id]
        : state.scene.rootIds;

      // add child ref to parent
      if (obj.parentId && objects[obj.parentId]) {
        objects[obj.parentId] = {
          ...objects[obj.parentId],
          childIds: [...objects[obj.parentId].childIds, obj.id],
        };
      }

      return { scene: { ...state.scene, objects, rootIds, version: state.scene.version + 1 } };
    });
  },

  removeObject: (id) => {
    set((state) => {
      const objects = { ...state.scene.objects };
      const obj = objects[id];
      if (!obj) return state;

      // recursively collect ids to remove
      const toRemove = new Set<string>();
      const collect = (oid: string) => {
        toRemove.add(oid);
        (objects[oid]?.childIds ?? []).forEach(collect);
      };
      collect(id);

      // remove from parent's childIds
      if (obj.parentId && objects[obj.parentId]) {
        objects[obj.parentId] = {
          ...objects[obj.parentId],
          childIds: objects[obj.parentId].childIds.filter((c) => c !== id),
        };
      }

      toRemove.forEach((oid) => delete objects[oid]);
      const rootIds = state.scene.rootIds.filter((r) => !toRemove.has(r));

      return { scene: { ...state.scene, objects, rootIds, version: state.scene.version + 1 } };
    });
  },

  upsertObject: (obj) => {
    set((state) => {
      const exists = !!state.scene.objects[obj.id];
      const objects = { ...state.scene.objects, [obj.id]: obj };
      const rootIds = !exists && obj.parentId === null
        ? [...state.scene.rootIds, obj.id]
        : state.scene.rootIds;
      return { scene: { ...state.scene, objects, rootIds, version: state.scene.version + 1 } };
    });
  },

  updateTransform: (id, transform) => {
    set((state) => {
      const obj = state.scene.objects[id];
      if (!obj) return state;
      return {
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, transform: { ...obj.transform, ...transform } },
          },
          version: state.scene.version + 1,
        },
      };
    });
  },

  updateMaterial: (id, material) => {
    set((state) => {
      const obj = state.scene.objects[id];
      if (!obj) return state;
      return {
        scene: {
          ...state.scene,
          objects: {
            ...state.scene.objects,
            [id]: { ...obj, material: { ...obj.material, ...material } },
          },
          version: state.scene.version + 1,
        },
      };
    });
  },

  updateObject: (id, patch) => {
    set((state) => {
      const obj = state.scene.objects[id];
      if (!obj) return state;
      return {
        scene: {
          ...state.scene,
          objects: { ...state.scene.objects, [id]: { ...obj, ...patch } },
          version: state.scene.version + 1,
        },
      };
    });
  },

  setParent: (id, parentId) => {
    set((state) => {
      const objects = { ...state.scene.objects };
      const obj = objects[id];
      if (!obj) return state;

      // remove from old parent
      if (obj.parentId && objects[obj.parentId]) {
        objects[obj.parentId] = {
          ...objects[obj.parentId],
          childIds: objects[obj.parentId].childIds.filter((c) => c !== id),
        };
      }

      // add to new parent
      if (parentId && objects[parentId]) {
        objects[parentId] = {
          ...objects[parentId],
          childIds: [...objects[parentId].childIds, id],
        };
      }

      objects[id] = { ...obj, parentId };
      const rootIds = parentId === null
        ? [...state.scene.rootIds.filter((r) => r !== id), id]
        : state.scene.rootIds.filter((r) => r !== id);

      return { scene: { ...state.scene, objects, rootIds, version: state.scene.version + 1 } };
    });
  },

  duplicateObject: (id) => {
    const obj = get().scene.objects[id];
    if (!obj) return null;
    const newObj: SceneObject = {
      ...obj,
      id: nanoid(),
      name: `${obj.name} (copy)`,
      parentId: obj.parentId,
      childIds: [],
      transform: {
        ...obj.transform,
        position: [
          obj.transform.position[0] + 0.5,
          obj.transform.position[1],
          obj.transform.position[2] + 0.5,
        ],
      },
    };
    get().addObject(newObj);
    return newObj;
  },

  clearScene: () => set({ scene: emptyScene() }),

  setSceneName: (name) =>
    set((state) => ({ scene: { ...state.scene, name } })),
});
