import * as Comlink from 'comlink';
import type { MeshWorkerAPI } from './meshWorker';

let worker: Worker | null = null;
let api: Comlink.Remote<MeshWorkerAPI> | null = null;

export function getMeshWorker(): Comlink.Remote<MeshWorkerAPI> {
  if (!api) {
    worker = new Worker(new URL('./meshWorker.ts', import.meta.url), { type: 'module' });
    api = Comlink.wrap<MeshWorkerAPI>(worker);
  }
  return api;
}

export function terminateMeshWorker() {
  worker?.terminate();
  worker = null;
  api = null;
}
