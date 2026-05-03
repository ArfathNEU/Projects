import { usePresence } from './usePresence';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function PresenceAvatars() {
  const users = usePresence();
  if (users.length === 0) return null;

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex items-center gap-1">
        {users.slice(0, 8).map((user) => (
          <Tooltip.Root key={user.id}>
            <Tooltip.Trigger asChild>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#12121e] cursor-default select-none"
                style={{ background: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-[#2a2a3e] text-xs text-white px-2 py-1 rounded shadow-lg"
                sideOffset={5}
              >
                {user.name}
                <Tooltip.Arrow className="fill-[#2a2a3e]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
        {users.length > 8 && (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-gray-300 border-2 border-[#12121e]">
            +{users.length - 8}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
