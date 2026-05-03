interface Env {
  STABILITY_API_KEY: string;
}

export async function handleTexture(request: Request, env: Env): Promise<Response> {
  const { prompt, width = 512, height = 512 } = await request.json() as {
    prompt: string;
    width?: number;
    height?: number;
  };

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.STABILITY_API_KEY}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          { text: `seamless tileable texture, ${prompt}, pbr material, top-down view`, weight: 1 },
          { text: 'blurry, low quality, watermark, signature', weight: -1 },
        ],
        cfg_scale: 7,
        height: Math.min(height, 1024),
        width: Math.min(width, 1024),
        steps: 30,
        samples: 1,
      }),
    }
  );

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Texture generation failed' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const data = await response.json() as { artifacts: Array<{ base64: string }> };
  const base64 = data.artifacts[0]?.base64;
  if (!base64) {
    return new Response(JSON.stringify({ error: 'No image returned' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const dataUrl = `data:image/png;base64,${base64}`;
  return new Response(JSON.stringify({ url: dataUrl }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
