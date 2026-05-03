import type { SceneObject } from './scene';

export interface AICommandRequest {
  prompt: string;
  sceneContext: string; // serialized current scene for Claude context
}

export interface AISceneOperation {
  op: 'add' | 'update' | 'remove' | 'reorder';
  objectId?: string;
  object?: Partial<SceneObject>;
  reason?: string;
}

export interface AICommandResponse {
  operations: AISceneOperation[];
  explanation: string;
}

export interface TextureGenRequest {
  prompt: string;
  width: number;
  height: number;
  style?: string;
}

export interface TextureGenResponse {
  url: string;
  prompt: string;
}
