"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { CategoryId } from "@/lib/categories";
import type { RoomPlayerState } from "@/lib/liveBattleRoom";
import RoomJoinCard from "../shared/RoomJoinCard";
import ConnectedPlayerList from "../shared/ConnectedPlayerList";

export default function HostLobby({
  t,
  roomCode,
  joinUrl,
  hostId,
  players,
  categoryId,
  level,
  questionCount,
  canStart,
  isStarting,
  onStart,
  onEndRoom,
  onRemovePlayer,
}: {
  t: UIStrings;
  roomCode: string;
  joinUrl: string;
  hostId: string;
  players: RoomPlayerState[];
  categoryId: CategoryId;
  level: number;
  questionCount: number;
  canStart: boolean;
  isStarting: boolean;
  onStart: () => void;
  onEndRoom: () => void;
  onRemovePlayer: (playerId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const th = t.multiplayerHost;
  const tm = t.multiplayerLobby;
  const categoryLabel = t.categories[categoryId]?.title ?? categoryId;

  return (
    <main
      className="min-h-screen w-full px-4 py-10 text-[#f3efe2] sm:px-8 lg:px-12"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">{tm.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl lg:text-5xl">{t.battle.title}</h1>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="flex flex-col gap-6">
            <RoomJoinCard
              roomCode={roomCode}
              joinUrl={joinUrl}
              roomCodeLabel={tm.roomCodeLabel}
              joinUrlLabel={th.joinUrlLabel}
              qrHeading={th.qrHeading}
              qrHint={th.qrHint}
              copyLabel={tm.copyCodeButton}
              copiedLabel={tm.copiedMessage}
              shareLabel={tm.shareButton}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{tm.categoryLabel}</div>
                <div className="mt-1 truncate font-display text-sm font-bold text-gold-300">{categoryLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{th.levelLabel}</div>
                <div className="mt-1 font-display text-sm font-bold text-gold-300">{level}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0]">{th.questionCountLabel}</div>
                <div className="mt-1 font-display text-sm font-bold text-gold-300">{questionCount}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                type="button"
                onClick={onStart}
                disabled={!canStart || isStarting}
                whileHover={reduceMotion || !canStart ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduceMotion || !canStart ? undefined : { scale: 0.98 }}
                className="flex-1 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-4 text-base font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? tm.startingBattle : th.startBattleButton}
              </motion.button>
              <button
                type="button"
                onClick={onEndRoom}
                className="rounded-full border border-red-400/40 px-6 py-4 text-sm font-bold text-red-300 outline-none transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                {th.endRoomButton}
              </button>
            </div>
            {!canStart && <p className="text-center text-xs text-[#8d94a3] sm:text-left">{tm.minPlayersHint}</p>}
          </div>

          <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#fbf6e8]">{th.waitingPlayersHeading}</h2>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#c6cbd6]">
                {th.connectedPlayersLabel.replace("{count}", String(players.length))}
              </span>
            </div>

            {players.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8d94a3]">{th.noPlayersYet}</p>
            ) : (
              <ConnectedPlayerList
                players={players}
                hostId={hostId}
                hostLabel={tm.hostBadge}
                readyLabel={tm.readyBadge}
                waitingLabel={tm.waitingBadge}
                disconnectedLabel={t.battleShared.disconnectedLabel}
                onRemove={onRemovePlayer}
                removeLabel={th.removePlayerButton}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
