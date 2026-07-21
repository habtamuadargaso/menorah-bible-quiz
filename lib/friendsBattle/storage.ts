import type { FriendsBattleMatchState } from "./types";

/** Dedicated to Friends Battle only — never shared with Live Battle, which
 * uses its own "menorah-player-name" key (see lib/liveBattleRoom.ts). */
const STORAGE_KEY = "menorah-friends-battle-match";

export function saveFriendsBattleMatch(state: FriendsBattleMatchState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write failures (e.g. private browsing / storage full)
  }
}

export function loadFriendsBattleMatch(): FriendsBattleMatchState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FriendsBattleMatchState;
  } catch {
    return null;
  }
}

export function clearFriendsBattleMatch(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
