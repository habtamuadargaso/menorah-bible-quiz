"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Glass summary card showing the room's details — used at the top of the
// lobby. Room "name" is a synthesized display label (host + category)
// since the rooms table has no dedicated name column; every other value
// below is a real, existing field.
const RoomCard = memo(function RoomCard({
  roomName,
  hostName,
  playerCount,
  maxPlayers,
  categoryTitle,
  difficultyLabel,
  languageName,
  labels,
}: {
  roomName: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  categoryTitle: string;
  difficultyLabel: string;
  languageName: string;
  labels: {
    roomNameLabel: string;
    hostLabel: string;
    maxPlayersLabel: string;
    categoryLabel: string;
    difficultyLabel: string;
    languageLabel: string;
    privacyLabel: string;
    privateRoomBadge: string;
  };
}) {
  const reduceMotion = useReducedMotion();

  const rows: Array<[string, string]> = [
    [labels.hostLabel, hostName],
    [labels.maxPlayersLabel, `${playerCount} / ${maxPlayers}`],
    [labels.categoryLabel, categoryTitle],
    [labels.difficultyLabel, difficultyLabel],
    [labels.languageLabel, languageName],
  ];

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: "easeOut" }}
      className="rounded-card border border-gold-500/25 bg-glass-gold p-6 shadow-premium-lg backdrop-blur-md sm:p-7"
    >
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{labels.roomNameLabel}</div>
      <div className="mt-1 font-display text-xl font-bold text-[#fbf6e8] sm:text-2xl">{roomName}</div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{label}</div>
            <div className="mt-0.5 truncate text-sm font-bold text-[#f3efe2]">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-200">
        🔒 {labels.privateRoomBadge}
      </div>
    </motion.div>
  );
});

export default RoomCard;
