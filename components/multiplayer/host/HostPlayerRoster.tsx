"use client";

import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { isConnected, type RoomPlayerState } from "@/lib/liveBattleRoom";

// Host-dashboard-only roster row: adds the score column and the 🟢/🟡/🔴
// color indicators the dashboard spec asks for. Deliberately a separate
// component from components/multiplayer/shared/ConnectedPlayerList (which
// the player's own lobby view also renders) so this dashboard-only change
// can't affect the player-facing screen.
const RosterRow = memo(function RosterRow({
  player,
  isHost,
  hostLabel,
  readyLabel,
  waitingLabel,
  disconnectedLabel,
  scoreLabel,
  onRemove,
  removeLabel,
}: {
  player: RoomPlayerState;
  isHost: boolean;
  hostLabel: string;
  readyLabel: string;
  waitingLabel: string;
  disconnectedLabel: string;
  scoreLabel: string;
  onRemove?: (playerId: string) => void;
  removeLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const connected = isConnected(player.lastSeenAt);
  const statusEmoji = !connected ? "🔴" : player.isReady ? "🟢" : "🟡";
  const statusText = !connected ? disconnectedLabel : player.isReady ? readyLabel : waitingLabel;

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={reduceMotion ? { duration: 0.2 } : { duration: 0.35, ease: "easeOut" }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.22)] transition-colors ${
        isHost ? "border-gold-500/40 bg-glass-gold" : "border-white/10 bg-white/[0.04] hover:border-white/20"
      } ${!connected ? "opacity-60" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border font-display text-base font-bold ${
              isHost ? "border-gold-500/60 bg-gold-500/15 text-gold-300" : "border-purple-400/40 bg-purple-500/15 text-purple-200"
            }`}
            aria-hidden
          >
            {player.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-[#f3efe2]">
            <span className="truncate">{player.displayName}</span>
          </div>
          {isHost && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gold-400">
              👑 {hostLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-[10px] uppercase tracking-wide text-[#8d94a3]">{scoreLabel}</div>
          <div className="font-display text-sm font-bold text-gold-300">{player.score}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            !connected
              ? "border-red-400/40 bg-red-500/10 text-red-300"
              : player.isReady
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                : "border-gold-400/40 bg-gold-500/10 text-gold-300"
          }`}
        >
          <span aria-hidden>{statusEmoji}</span>
          {statusText}
        </span>
        {onRemove && !isHost && (
          <button
            type="button"
            onClick={() => onRemove(player.playerId)}
            aria-label={`${removeLabel} ${player.displayName}`}
            className="rounded-full border border-red-400/40 px-2.5 py-1 text-[11px] font-bold text-red-300 outline-none transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {removeLabel}
          </button>
        )}
      </div>
    </motion.li>
  );
});

export default function HostPlayerRoster({
  players,
  hostId,
  hostLabel,
  readyLabel,
  waitingLabel,
  disconnectedLabel,
  scoreLabel,
  onRemove,
  removeLabel,
}: {
  players: RoomPlayerState[];
  hostId: string;
  hostLabel: string;
  readyLabel: string;
  waitingLabel: string;
  disconnectedLabel: string;
  scoreLabel: string;
  onRemove?: (playerId: string) => void;
  removeLabel?: string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {players.map((player) => (
          <RosterRow
            key={player.id}
            player={player}
            isHost={player.playerId === hostId}
            hostLabel={hostLabel}
            readyLabel={readyLabel}
            waitingLabel={waitingLabel}
            disconnectedLabel={disconnectedLabel}
            scoreLabel={scoreLabel}
            onRemove={onRemove}
            removeLabel={removeLabel}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
