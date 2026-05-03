import { useState, useEffect } from 'react';
import { getAwareness } from '@/collab/yjsDoc';
import { getRemoteUsers } from '@/collab/awareness';
import type { UserPresence } from '@/types/collab';

export function usePresence(): UserPresence[] {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    const awareness = getAwareness();
    if (!awareness) return;

    const update = () => setUsers(getRemoteUsers(awareness));
    awareness.on('change', update);
    update();

    return () => awareness.off('change', update);
  }, []);

  return users;
}
