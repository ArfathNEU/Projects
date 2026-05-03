import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { useAICommand } from './useAICommand';
import { Sparkles, Loader, X, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const SUGGESTIONS = [
  'Make this room look like a cyberpunk apartment at night',
  'Add a simple table and chairs setup',
  'Create a sci-fi floating platform',
  'Make all lights warm and cinematic',
  'Add fog and a moody atmosphere',
  'Create a minimalist zen garden',
];

export default function AICommandBar() {
  const open          = useStore((s) => s.aiCommandBarOpen);
  const closeBar      = useStore((s) => s.closeAICommandBar);
  const [input, setInput] = useState('');
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const { execute, loading, error, lastExplanation } = useAICommand();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    await execute(input.trim());
    if (!error) {
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
    if (e.key === 'Escape') closeBar();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && closeBar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-[600px] max-w-[90vw] bg-[#16162a] border border-[#3a3a5c] rounded-xl shadow-2xl overflow-hidden">
          <Dialog.Title className="sr-only">AI Scene Command</Dialog.Title>
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#2a2a3e]">
            <Sparkles size={16} className="text-blue-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-white">AI Scene Command</span>
            <kbd className="ml-auto text-[10px] text-gray-500 bg-[#2a2a3e] px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>

          <div className="p-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to do with the scene…"
              rows={3}
              className="w-full bg-[#1e1e2e] border border-[#3a3a5c] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-400 placeholder-gray-600"
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-gray-600">⌘↵ to submit</span>
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded-lg px-4 py-2 transition-colors"
              >
                {loading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {loading ? 'Thinking…' : 'Apply to Scene'}
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {lastExplanation && !error && (
              <div className="mt-3 bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2 text-xs text-green-300">
                {lastExplanation}
              </div>
            )}

            {!input && !lastExplanation && (
              <div className="mt-4">
                <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Suggestions</div>
                <div className="space-y-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 text-left transition-colors"
                    >
                      <ChevronRight size={10} className="flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
