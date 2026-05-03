import type { Vec3 } from './scene';

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor3D: Vec3 | null;
  selectedIds: string[];
  activeTool: string;
}

export interface AwarenessState {
  user: UserPresence;
}

export interface CollabRoom {
  roomId: string;
  users: UserPresence[];
}
