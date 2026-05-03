import { handleClaude } from './routes/claude';
import { handleTexture } from './routes/stability';
import { CollabRoom } from './durable-objects/CollabRoom';

export { CollabRoom };

interface Env {
  ANTHROPIC_API_KEY: string;
  STABILITY_API_KEY: string;
  COLLAB_ROOM: DurableObjectNamespace;
}

function cors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── Collaboration WebSocket relay ──
    if (url.pathname.startsWith('/collab/')) {
      const roomId = url.pathname.slice('/collab/'.length) || 'default';
      const id = env.COLLAB_ROOM.idFromName(roomId);
      const obj = env.COLLAB_ROOM.get(id);
      return obj.fetch(request);
    }

    // ── AI proxy routes ──
    if (url.pathname === '/api/claude' && request.method === 'POST') {
      return cors(await handleClaude(request, env));
    }

    if (url.pathname === '/api/texture' && request.method === 'POST') {
      return cors(await handleTexture(request, env));
    }

    // ── Health check ──
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
