interface Env {
  ANTHROPIC_API_KEY: string;
}

const SYSTEM_PROMPT = `You are an AI assistant for a 3D scene builder. The user will describe changes they want to make to a 3D scene.

You must respond with valid JSON matching this TypeScript interface:
interface Response {
  operations: Array<{
    op: "add" | "update" | "remove";
    objectId?: string;    // required for update/remove
    object?: {           // required for add/update
      name?: string;
      type?: "mesh" | "light" | "group";
      transform?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number];
      };
      geometry?: {
        type?: "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane" | "capsule";
        params?: Record<string, number>;
      };
      material?: {
        color?: string;       // hex color e.g. "#ff0000"
        roughness?: number;   // 0-1
        metalness?: number;   // 0-1
        emissive?: string;
        emissiveIntensity?: number;
        opacity?: number;
        transparent?: boolean;
        wireframe?: boolean;
      };
      light?: {
        type?: "directional" | "point" | "spot" | "ambient" | "hemisphere";
        color?: string;
        intensity?: number;
        castShadow?: boolean;
        distance?: number;
        groundColor?: string;
      };
      visible?: boolean;
    };
    reason?: string;
  }>;
  explanation: string;  // Brief human-readable summary of what you did
}

Rules:
- Be creative but precise with positions and colors
- Use realistic scale (1 unit ≈ 1 meter)
- For lighting scenes, adjust emissive colors and add appropriate lights
- Reference existing objects by their objectId when updating/removing
- Return ONLY the JSON object, no markdown fences`;

export async function handleClaude(request: Request, env: Env): Promise<Response> {
  const { prompt, sceneContext } = await request.json() as { prompt: string; sceneContext: string };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Current scene state:\n${sceneContext}\n\nUser request: ${prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find((c) => c.type === 'text')?.text ?? '{}';

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { operations: [], explanation: 'AI returned invalid JSON. Please try again.' };
  }

  return new Response(JSON.stringify(parsed), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
