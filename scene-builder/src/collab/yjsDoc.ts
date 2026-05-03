import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WebrtcProvider } from 'y-webrtc';

export const ydoc = new Y.Doc();

// Flat map: objectId → Y.Map of serialized SceneObject fields
export const yObjects = ydoc.getMap<Y.Map<unknown>>('objects');
export const yRootIds = ydoc.getArray<string>('rootIds');
export const yMeta    = ydoc.getMap<unknown>('meta');

let wsProvider: WebsocketProvider | null = null;
let rtcProvider: WebrtcProvider | null = null;

export function getRoomId(): string {
  const hash = window.location.hash.slice(1);
  if (hash) return hash;
  const id = Math.random().toString(36).slice(2, 10);
  window.location.hash = id;
  return id;
}

export function initProviders(roomId: string) {
  const workerUrl = import.meta.env.VITE_WORKER_URL;

  if (workerUrl) {
    wsProvider = new WebsocketProvider(`${workerUrl}/collab`, roomId, ydoc, {
      connect: true,
    });
    wsProvider.on('status', ({ status }: { status: string }) => {
      if (status === 'disconnected') {
        console.warn('[collab] WebSocket disconnected, relying on WebRTC fallback');
      }
    });
  }

  rtcProvider = new WebrtcProvider(roomId, ydoc, {
    signaling: ['wss://signaling.yjs.dev'],
  });

  return { wsProvider, rtcProvider };
}

export function getAwareness() {
  return wsProvider?.awareness ?? rtcProvider?.awareness ?? null;
}

export function destroyProviders() {
  wsProvider?.destroy();
  rtcProvider?.destroy();
  wsProvider = null;
  rtcProvider = null;
}
