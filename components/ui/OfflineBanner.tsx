"use client";

import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * Mission 6 Part 9. `mode="reassure"` (Friends Battle, Solo) tells the
 * player they're offline but that's fine for this mode. `mode="block"`
 * (Live Battle) warns that this specific mode needs a connection.
 */
export function OfflineBanner({ mode, reassureText, blockText }: { mode: "reassure" | "block"; reassureText: string; blockText: string }) {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className={`mx-auto mb-4 max-w-md rounded-xl border px-4 py-3 text-center text-sm ${
        mode === "block" ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-sky-400/30 bg-sky-500/10 text-sky-200"
      }`}
    >
      {mode === "block" ? blockText : reassureText}
    </div>
  );
}
