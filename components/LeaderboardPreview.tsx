"use client";

import { motion } from "framer-motion";
import type { ScoreEntry } from "@/lib/leaderboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const AVATAR_THEMES = [
  "from-purple-400 to-purple-600",
  "from-gold-400 to-gold-600",
  "from-purple-300 to-purple-500",
  "from-gold-300 to-gold-500",
];

function avatarTheme(name: string) {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_THEMES[sum % AVATAR_THEMES.length];
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPreview({
  entries,
  onViewAll,
}: {
  entries: ScoreEntry[];
  onViewAll: () => void;
}) {
  const { t, lang } = useLanguage();
  const isAmharic = lang === "am";
  const rows = [...entries].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-14">
      <div className="rounded-[32px] border border-gold-500/25 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,.34)] backdrop-blur-md sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-[#fbf6e8]">
            {t.leaderboard.heading}
          </h2>
          <div className="rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-400">
            {isAmharic ? "ከፍተኛ ውጤቶች" : "Top Scores"}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-[#8d94a3]">
            {t.leaderboard.empty}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((row, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const medal = MEDALS[rank];
              const ringClass =
                rank === 1
                  ? "ring-2 ring-gold-400"
                  : rank === 2
                  ? "ring-2 ring-white/40"
                  : rank === 3
                  ? "ring-2 ring-gold-700/60"
                  : "";

              return (
                <motion.div
                  key={`${row.name}-${row.date}-${i}`}
                  initial={{ opacity: 0, x: -16, scale: 0.97 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    isTop3
                      ? "border-gold-500/30 bg-gold-500/[0.06]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="w-6 flex-shrink-0 text-center text-sm font-bold text-[#9aa1b0]">
                    {rank}
                  </div>

                  <div className="relative flex-shrink-0">
                    {rank === 1 && (
                      <motion.span
                        aria-hidden
                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-base"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        👑
                      </motion.span>
                    )}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-navy-950 ${avatarTheme(
                        row.name
                      )} ${ringClass}`}
                    >
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    {medal && (
                      <span className="absolute -bottom-1 -right-1 text-sm leading-none">
                        {medal}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#f3efe2]">
                      {row.name}
                    </div>
                    <div className="truncate text-xs text-[#8d94a3]">
                      {row.categoryTitle}
                    </div>
                  </div>

                  <div className="font-display text-lg font-bold text-gold-500">
                    {row.score}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <button
          onClick={onViewAll}
          className="mt-6 w-full rounded-full border border-gold-500/40 px-6 py-3 text-sm font-bold text-gold-400 transition-colors hover:bg-gold-500/10"
        >
          {isAmharic ? "ሙሉ ደረጃ ሰንጠረዥ ይመልከቱ" : "View Full Leaderboard"}
        </button>
      </div>
    </section>
  );
}
