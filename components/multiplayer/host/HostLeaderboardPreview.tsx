"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import { fetchLeaderboard, formatMetricValue, type LeaderboardRow } from "@/lib/globalLeaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

// Read-only teaser of the existing site-wide leaderboard (Sprint 6's
// get_leaderboard RPC via lib/globalLeaderboard.ts — no schema change, no
// new Supabase logic) shown while a room waits in the lobby. Purely
// decorative/engagement content; it never reads or writes anything about
// this specific room.
export default function HostLeaderboardPreview({ t }: { t: UIStrings }) {
  const th = t.multiplayerHost;
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard({ metric: "total_xp", window: "all_time", limit: 5 })
      .then((result) => {
        if (!cancelled) setRows(result.rows);
      })
      .catch((error) => {
        console.error("Leaderboard preview failed to load:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-premium 2xl:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 2xl:text-sm">{th.leaderboardPreviewHeading}</h2>
        <span aria-hidden className="text-base">
          🏆
        </span>
      </div>
      <p className="mb-3 text-[11px] text-[#8d94a3]">{th.leaderboardPreviewHint}</p>

      {failed ? (
        <p className="py-4 text-center text-sm text-[#8d94a3]">{th.leaderboardPreviewUnavailable}</p>
      ) : rows === null ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={th.leaderboardPreviewLoading}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.05]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#8d94a3]">{th.leaderboardPreviewEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <motion.li
              key={row.playerId}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0.2 : 0.3, delay: index * 0.05 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                index < 3 ? "border-gold-500/20 bg-glass-gold" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-5 flex-shrink-0 text-center text-sm" aria-hidden>
                  {MEDALS[index] ?? index + 1}
                </span>
                <span className="truncate text-sm font-semibold text-[#f3efe2]">{row.displayName}</span>
              </div>
              <span className="flex-shrink-0 font-display text-sm font-bold text-gold-300">
                {formatMetricValue(row.totalXp, "total_xp")}
              </span>
            </motion.li>
          ))}
        </ul>
      )}

      {/* Opens in a new tab rather than navigating — the host stays on
          their live dashboard instead of losing the TV/projector view. */}
      <a
        href="/leaderboard"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded-full border border-white/15 px-4 py-2 text-center text-xs font-bold text-[#c6cbd6] outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        {th.viewFullLeaderboardButton}
      </a>
    </div>
  );
}
