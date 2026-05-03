import * as Y from 'yjs';
import { encodeStateAsUpdate, applyUpdate } from 'yjs';

interface Env {
  COLLAB_ROOM: DurableObjectNamespace;
}

export class CollabRoom {
  private state: DurableObjectState;
  private clients = new Map<WebSocket, { id: number }>();
  private doc: Y.Doc;
  private clientIdCounter = 0;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
    this.doc   = new Y.Doc();
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleSession(ws: WebSocket) {
    this.state.acceptWebSocket(ws);
    const clientId = ++this.clientIdCounter;
    this.clients.set(ws, { id: clientId });

    // Send current doc state to new joiner
    const savedState = await this.state.storage.get<Uint8Array>('ydoc');
    if (savedState) {
      try {
        applyUpdate(this.doc, savedState);
      } catch {/* ignore stale data */}
    }
    const update = encodeStateAsUpdate(this.doc);
    if (update.byteLength > 2) {
      ws.send(update);
    }
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message === 'string') return;
    const update = new Uint8Array(message);

    try {
      applyUpdate(this.doc, update);
    } catch {
      return;
    }

    // Persist merged state
    const merged = encodeStateAsUpdate(this.doc);
    await this.state.storage.put('ydoc', merged);

    // Broadcast to all other clients
    for (const [client] of this.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {/* client disconnected */}
      }
    }
  }

  webSocketClose(ws: WebSocket) {
    this.clients.delete(ws);
  }

  webSocketError(ws: WebSocket) {
    this.clients.delete(ws);
  }
}
