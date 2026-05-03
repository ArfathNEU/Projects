import type { Awareness } from 'y-protocols/awareness';
import type { UserPresence } from '@/types/collab';

const COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80',
  '#34d399', '#38bdf8', '#818cf8', '#e879f9',
];

let localColor = COLORS[Math.floor(Math.random() * COLORS.length)];
let localName = `User ${Math.floor(Math.random() * 9000) + 1000}`;

export function setLocalPresence(awareness: Awareness, data: Partial<UserPresence> & { id: string }) {
  awareness.setLocalStateField('user', {
    color: localColor,
    name: localName,
    cursor3D: null,
    selectedIds: [],
    activeTool: 'translate',
    ...data,
  } satisfies UserPresence);
}

export function getRemoteUsers(awareness: Awareness): UserPresence[] {
  const states = awareness.getStates();
  const users: UserPresence[] = [];
  states.forEach((state, clientId) => {
    if (clientId !== awareness.clientID && state.user) {
      users.push(state.user as UserPresence);
    }
  });
  return users;
}

export function setUserName(name: string) {
  localName = name;
}

export function getUserColor() {
  return localColor;
}
