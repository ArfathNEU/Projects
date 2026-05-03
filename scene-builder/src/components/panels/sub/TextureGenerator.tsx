import { useState } from 'react';
import { useStore } from '@/store';
import { syncObjectToYjs } from '@/store/middleware/yjsMiddleware';
import { Sparkles, Loader } from 'lucide-react';

interface Props { objectId: string }

export default function TextureGenerator({ objectId }: Props) {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState('');

  const obj            = useStore((s) => s.scene.objects[objectId]);
  const updateMaterial = useStore((s) => s.updateMaterial);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL ?? '';
      const res = await fetch(`${workerUrl}/api/texture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 512, height: 512 }),
      });
      if (!res.ok) throw new Error(`Texture generation failed: ${res.statusText}`);
      const data = await res.json() as { url: string };
      setPreview(data.url);
      updateMaterial(objectId, { textureUrl: data.url });
      if (obj) syncObjectToYjs({ ...obj, material: { ...obj.material, textureUrl: data.url } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!obj || obj.type !== 'mesh') return null;

  return (
    <div className="px-3 py-2">
      <div className="text-xs text-gray-400 mb-2">AI Texture Generation</div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the texture... (e.g. 'rusted metal with orange streaks')"
        rows={2}
        className="w-full bg-[#1e1e2e] border border-[#3a3a5c] rounded px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-blue-400 placeholder-gray-600"
      />
      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded py-1.5 transition-colors"
      >
        {loading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
        {loading ? 'Generating…' : 'Generate Texture'}
      </button>

      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Generated texture" className="w-full rounded border border-[#3a3a5c]" />
        </div>
      )}
    </div>
  );
}
