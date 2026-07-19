"use client";

import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { isConnected, type RoomPlayerState } from "@/lib/liveBattleRoom";

const PlayerRow = memo(function PlayerRow({
  player,
  isHost,
  isYou,
  hostLabel,
  readyLabel,
  waitingLabel,
  disconnectedLabel,
  onRemove,
  removeLabel,
}: {
  player: RoomPlayerState;
  isHost: boolean;
  isYou: boolean;
  hostLabel: string;
  readyLabel: string;
  waitingLabel: string;
  disconnectedLabel: string;
  onRemove?: (playerId: string) => void;
  removeLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const connected = isConnected(player.lastSeenAt);

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }}
      transition={reduceMotion ? { duration: 0.2 } : { duration: 0.35, ease: "easeOut" }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.22)] ${
        isHost ? "border-gold-500/40 bg-glass-gold" : "border-white/10 bg-white/[0.04]"
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
          <span
            aria-hidden
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-950 ${
              connected ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-[#f3efe2]">
            <span className="truncate">{player.displayName}</span>
            {isYou && <span className="text-xs font-normal text-[#8d94a3]">(you)</span>}
          </div>
          {isHost ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gold-400">
              👑 {hostLabel}
            </span>
          ) : !connected ? (
            <span className="text-[11px] font-semibold text-red-300">{disconnectedLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            player.isReady
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
              : "border-white/15 bg-white/[0.03] text-[#9aa1b0]"
          }`}
        >
          {player.isReady ? `✓ ${readyLabel}` : waitingLabel}
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

export default function ConnectedPlayerList({
  players,
  hostId,
  myPlayerId,
  hostLabel,
  readyLabel,
  waitingLabel,
  disconnectedLabel,
  onRemove,
  removeLabel,
}: {
  players: RoomPlayerState[];
  hostId: string;
  myPlayerId?: string;
  hostLabel: string;
  readyLabel: string;
  waitingLabel: string;
  disconnectedLabel: string;
  onRemove?: (playerId: string) => void;
  removeLabel?: string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isHost={player.playerId === hostId}
            isYou={player.playerId === myPlayerId}
            hostLabel={hostLabel}
            readyLabel={readyLabel}
            waitingLabel={waitingLabel}
            disconnectedLabel={disconnectedLabel}
            onRemove={onRemove}
            removeLabel={removeLabel}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
