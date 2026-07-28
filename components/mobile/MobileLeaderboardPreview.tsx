"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ScoreEntry } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Mission 18 — mobile-only premium variant of the home dashboard's
// leaderboard preview (section 7: "create a mobile-only leaderboard visual
// variant if needed. Desktop must remain unchanged."). Reuses the exact
// same ScoreEntry[] data and sort/slice-to-5 logic as the desktop
// components/LeaderboardPreview.tsx (which stays untouched, still used by
// the `hidden md:block` branch) — this only changes how those same rows
// are drawn: a compact top-3 podium plus dark list rows, using the
// centralized gold/silver/bronze tokens instead of the desktop version's
// ad hoc ring colors.
const AVATAR_THEMES = [
  "from-purple-400 to-purple-600",
  "from-gold-400 to-gold-600",
  "from-teal-400 to-teal-500",
  "from-streak-400 to-streak-500",
];

function avatarTheme(name: string) {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_THEMES[sum % AVATAR_THEMES.length];
}

const RANK_META = [
  { ring: "ring-gold-400", medal: "🥇", height: "h-16", text: "text-gold-400" },
  { ring: "ring-silver-400", medal: "🥈", height: "h-12", text: "text-silver-300" },
  { ring: "ring-bronze-400", medal: "🥉", height: "h-10", text: "text-bronze-300" },
];

export default function MobileLeaderboardPreview({
  entries,
  onViewAll,
  currentPlayerName,
}: {
  entries: ScoreEntry[];
  onViewAll: () => void;
  currentPlayerName?: string;
}) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const rows = [...entries].sort((a, b) => b.score - a.score).slice(0, 5);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  if (rows.length === 0) {
    return (
      <div className="rounded-card-sm border border-gold-500/20 bg-white/[0.04] p-6 text-center text-sm text-[#8d94a3] shadow-premium">
        {t.leaderboard.empty}
      </div>
    );
  }

  return (
    <div className="rounded-card-sm border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-navy-900/50 to-purple-500/10 p-4 shadow-premium">
      {/* top-3 podium */}
      <div className="flex items-end justify-center gap-3 px-2 pb-1">
        {[podium[1], podium[0], podium[2]].map((row, i) => {
          if (!row) return <div key={i} className="w-16" />;
          const rankIndex = row === podium[0] ? 0 : row === podium[1] ? 1 : 2;
          const meta = RANK_META[rankIndex];
          const isMe = currentPlayerName && row.name === currentPlayerName;
          return (
            <motion.div
              key={`${row.name}-${row.date}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: rankIndex * 0.06 }}
              className="flex w-16 flex-col items-center"
            >
              <div className="relative">
                {rankIndex === 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm">👑</span>}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-navy-950 ring-2 ring-offset-2 ring-offset-navy-950 ${avatarTheme(
                    row.name
                  )} ${meta.ring} ${isMe ? "ring-gold-300" : ""}`}
                >
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 text-xs leading-none">{meta.medal}</span>
              </div>
              <div className="mt-1.5 max-w-[64px] truncate text-[11px] font-semibold text-[#f3efe2]">{row.name}</div>
              <div className={`font-display text-xs font-bold ${meta.text}`}>{row.score}</div>
              <div className={`mt-1.5 w-12 rounded-t-lg bg-white/[0.05] ${meta.height}`} />
            </motion.div>
          );
        })}
      </div>

      {/* remaining rows */}
      {rest.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {rest.map((row, i) => {
            const isMe = currentPlayerName && row.name === currentPlayerName;
            return (
              <div
                key={`${row.name}-${row.date}`}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                  isMe ? "border-gold-400/60 bg-gold-500/[0.06]" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <span className="w-4 flex-shrink-0 text-center text-xs font-bold text-[#8d94a3]">{i + 4}</span>
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-navy-950 ${avatarTheme(row.name)}`}
                >
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#f3efe2]">{row.name}</span>
                <span className="font-display text-sm font-bold text-gold-400">{row.score}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onViewAll}
        className="mt-4 w-full rounded-full border border-gold-500/40 py-2.5 text-xs font-bold text-gold-400 outline-none transition-colors hover:border-gold-400 hover:bg-gold-500/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        {t.leaderboard.heading} →
      </button>
    </div>
  );
}
