import * as Comlink from 'comlink';
import { buildBVH } from './tasks/buildBVH';
import { generateGeometry } from './tasks/generateGeometry';

const api = {
  buildBVH,
  generateGeometry,
};

export type MeshWorkerAPI = typeof api;

Comlink.expose(api);
