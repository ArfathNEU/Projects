export function getRoomShareUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.hash = roomId;
  return url.toString();
}

export function parseRoomId(): string | null {
  const hash = window.location.hash.slice(1);
  return hash || null;
}
