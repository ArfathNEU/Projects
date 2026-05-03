import { useState } from 'react';
import { useStore } from '@/store';
import { exportToGLTF, downloadBlob } from '@/lib/sceneSerializer';
import { getRoomShareUrl } from '@/collab/roomUrl';
import {
  MousePointer, Move, RotateCcw, Maximize2, Grid3X3, Cpu,
  Download, Share2, Sparkles, BarChart2, Eye, EyeOff, Check
} from 'lucide-react';
import type { ActiveTool } from '@/store/slices/uiSlice';
import clsx from 'clsx';

const TOOLS: { id: ActiveTool; label: string; Icon: React.ElementType; shortcut: string }[] = [
  { id: 'select',    label: 'Select',    Icon: MousePointer, shortcut: 'Q' },
  { id: 'translate', label: 'Move',      Icon: Move,         shortcut: 'G' },
  { id: 'rotate',    label: 'Rotate',    Icon: RotateCcw,    shortcut: 'R' },
  { id: 'scale',     label: 'Scale',     Icon: Maximize2,    shortcut: 'S' },
];

export default function Toolbar() {
  // Primitive selectors — stable references, no shallow needed
  const activeTool       = useStore((s) => s.activeTool);
  const setActiveTool    = useStore((s) => s.setActiveTool);
  const showGrid         = useStore((s) => s.showGrid);
  const toggleGrid       = useStore((s) => s.toggleGrid);
  const showStats        = useStore((s) => s.showStats);
  const toggleStats      = useStore((s) => s.toggleStats);
  const shadersEnabled   = useStore((s) => s.shadersEnabled);
  const toggleShaders    = useStore((s) => s.toggleShaders);
  const aoEnabled        = useStore((s) => s.aoEnabled);
  const toggleAO         = useStore((s) => s.toggleAO);
  const fogEnabled       = useStore((s) => s.fogEnabled);
  const toggleFog        = useStore((s) => s.toggleFog);
  const sceneName        = useStore((s) => s.scene.name);
  const scene            = useStore((s) => s.scene);
  const openAICommandBar = useStore((s) => s.openAICommandBar);
  const transformSpace   = useStore((s) => s.transformSpace);
  const setTransformSpace = useStore((s) => s.setTransformSpace);

  const [shareLabel, setShareLabel] = useState('Share');
  const [exporting, setExporting]   = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const buf = await exportToGLTF(scene);
      downloadBlob(buf, `${sceneName.replace(/\s+/g, '_')}.glb`);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = () => {
    const url = getRoomShareUrl(window.location.hash.slice(1) || 'room');
    navigator.clipboard.writeText(url).then(() => {
      setShareLabel('Copied!');
      setTimeout(() => setShareLabel('Share'), 2000);
    });
  };

  return (
    <div className="h-12 bg-[#12121e] border-b border-[#2a2a3e] flex items-center gap-1 px-3 flex-shrink-0">
      {/* Brand */}
      <div className="text-sm font-bold text-white mr-3 flex items-center gap-1.5">
        <Cpu size={14} className="text-blue-400" />
        <span className="text-blue-400">Scene</span>Builder
      </div>

      <div className="w-px h-6 bg-[#2a2a3e] mx-1" />

      {/* Transform tools */}
      {TOOLS.map(({ id, label, Icon, shortcut }) => (
        <button
          key={id}
          onClick={() => setActiveTool(id)}
          title={`${label} (${shortcut})`}
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors',
            activeTool === id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Icon size={13} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-[#2a2a3e] mx-1" />

      {/* Transform space toggle */}
      <button
        onClick={() => setTransformSpace(transformSpace === 'world' ? 'local' : 'world')}
        title="Toggle world/local space"
        className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-[#3a3a5c]"
      >
        {transformSpace === 'world' ? 'World' : 'Local'}
      </button>

      <div className="w-px h-6 bg-[#2a2a3e] mx-1" />

      {/* View toggles */}
      <button onClick={toggleGrid} title="Toggle grid" className={clsx('p-1.5 rounded transition-colors', showGrid ? 'text-blue-400' : 'text-gray-600 hover:text-gray-300')}>
        <Grid3X3 size={14} />
      </button>
      <button onClick={toggleStats} title="Toggle stats" className={clsx('p-1.5 rounded transition-colors', showStats ? 'text-blue-400' : 'text-gray-600 hover:text-gray-300')}>
        <BarChart2 size={14} />
      </button>
      <button onClick={toggleShaders} title="Toggle post-processing" className={clsx('p-1.5 rounded transition-colors', shadersEnabled ? 'text-blue-400' : 'text-gray-600 hover:text-gray-300')}>
        {shadersEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button onClick={toggleAO} title="Toggle bloom/glow" className={clsx('p-1.5 rounded text-xs transition-colors', aoEnabled ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300')}>
        AO
      </button>
      <button onClick={toggleFog} title="Toggle depth fog" className={clsx('p-1.5 rounded text-xs transition-colors', fogEnabled ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-300')}>
        Fog
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* AI command */}
      <button
        onClick={openAICommandBar}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-medium transition-all"
      >
        <Sparkles size={12} />
        AI Command
        <kbd className="text-[9px] bg-black/20 px-1 rounded">⌘K</kbd>
      </button>

      <div className="w-px h-6 bg-[#2a2a3e] mx-1" />

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        {shareLabel === 'Copied!' ? <Check size={13} className="text-green-400" /> : <Share2 size={13} />}
        {shareLabel}
      </button>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs bg-[#1e1e2e] border border-[#3a3a5c] text-gray-300 hover:text-white hover:border-blue-400 transition-colors"
      >
        <Download size={13} />
        {exporting ? 'Exporting…' : 'Export GLB'}
      </button>
    </div>
  );
}
