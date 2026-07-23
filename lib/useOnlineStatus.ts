"use client";

import { useEffect, useState } from "react";

/**
 * Mission 6 Part 9 — offline experience. Solo Play and Friends Battle are
 * already fully local (no network needed once the page has loaded — see
 * Missions 5B/5D), but neither surfaced a clear "you're offline" signal,
 * and Live Battle gave no explicit warning before a player tried to join
 * a room with no connection. This hook is the single source of truth for
 * "is the browser online right now," used by the banners below.
 *
 * Starts `true` (not `navigator.onLine`) so the server-rendered HTML and
 * the first client render always match — the real value is only read
 * after mount, same hydration-safety pattern used throughout this app
 * (LanguageContext, Friends Battle's storage rehydration, etc.).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
