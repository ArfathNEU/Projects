import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { Plugin } from 'vite';

function aiProxyPlugin(): Plugin {
  let apiKey: string | undefined;

  return {
    name: 'ai-proxy',
    configResolved(config) {
      apiKey = config.env?.VITE_ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    },
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' });
          res.end();
          return;
        }

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Set VITE_ANTHROPIC_API_KEY in .env.local to use AI commands locally' }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());

            const systemPrompt = `You are an AI assistant for a 3D scene builder. The user will describe changes they want to make to a 3D scene.

You must respond with valid JSON matching this TypeScript interface:
interface Response {
  operations: Array<{
    op: "add" | "update" | "remove";
    objectId?: string;
    object?: {
      name?: string;
      type?: "mesh" | "light" | "group";
      transform?: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number]; };
      geometry?: { type?: "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane" | "capsule"; params?: Record<string, number>; };
      material?: { color?: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number; opacity?: number; transparent?: boolean; wireframe?: boolean; };
      light?: { type?: "directional" | "point" | "spot" | "ambient" | "hemisphere"; color?: string; intensity?: number; castShadow?: boolean; distance?: number; groundColor?: string; };
      visible?: boolean;
    };
    reason?: string;
  }>;
  explanation: string;
}

Rules:
- Be creative but precise with positions and colors
- Use realistic scale (1 unit = 1 meter)
- For lighting scenes, adjust emissive colors and add appropriate lights
- Reference existing objects by their objectId when updating/removing
- Return ONLY the JSON object, no markdown fences`;

            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey!,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: systemPrompt,
                messages: [{ role: 'user', content: `Current scene state:\n${body.sceneContext}\n\nUser request: ${body.prompt}` }],
              }),
            });

            if (!upstream.ok) {
              const err = await upstream.text();
              res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err }));
              return;
            }

            const data = await upstream.json() as { content: Array<{ type: string; text: string }> };
            let text = data.content.find((c: { type: string }) => c.type === 'text')?.text ?? '{}';

            // Strip markdown code fences if Claude wraps the JSON
            text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

            // Try to extract JSON object if there's surrounding text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) text = jsonMatch[0];

            let parsed;
            try {
              parsed = JSON.parse(text);
            } catch {
              console.error('[ai-proxy] Failed to parse Claude response:', text.slice(0, 200));
              parsed = { operations: [], explanation: 'AI returned invalid JSON. Please try again.' };
            }

            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(parsed));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });

      server.middlewares.use('/api/texture', async (req, res) => {
        res.writeHead(501, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Texture generation requires the deployed CF Worker with STABILITY_API_KEY' }));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), aiProxyPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      exclude: ['three-mesh-bvh'],
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'collab': ['yjs', 'y-websocket'],
            'postprocessing': ['postprocessing', '@react-three/postprocessing'],
          },
        },
      },
    },
  };
});
