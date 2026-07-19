"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { CategoryId } from "@/lib/categories";
import type { LangCode } from "@/lib/i18n/locales";
import { LANGUAGES } from "@/lib/i18n/locales";
import { difficultyForLevel } from "@/lib/levels";
import { isConnected, type RoomPlayerState } from "@/lib/liveBattleRoom";
import RoomJoinCard from "../shared/RoomJoinCard";
import HostPlayerRoster from "./HostPlayerRoster";

function StatTile({
  icon,
  label,
  value,
  delay,
  reduceMotion,
  emphasize,
}: {
  icon: string;
  label: string;
  value: string;
  delay: number;
  reduceMotion: boolean | null;
  /** Highlights the tile (gold -> emerald) when the metric hits its target,
   * e.g. Ready Players once everyone has checked in. */
  emphasize?: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.35, delay }}
      className={`rounded-2xl border px-4 py-3.5 text-center shadow-[0_4px_18px_rgba(0,0,0,0.18)] transition-colors 2xl:px-5 2xl:py-5 ${
        emphasize
          ? "border-emerald-400/40 bg-emerald-500/[0.08] hover:border-emerald-400/60"
          : "border-white/10 bg-white/[0.04] hover:border-gold-500/30 hover:bg-white/[0.06]"
      }`}
    >
      <div className="text-lg 2xl:text-2xl" aria-hidden>
        {icon}
      </div>
      <div className={`mt-1 font-display text-xl font-bold 2xl:text-3xl ${emphasize ? "text-emerald-300" : "text-gold-300"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-[#9aa1b0] 2xl:text-xs">{label}</div>
    </motion.div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center 2xl:px-5 2xl:py-5">
      <div className="text-[11px] uppercase tracking-wide text-[#9aa1b0] 2xl:text-xs">{label}</div>
      <div className="mt-1 truncate font-display text-sm font-bold text-gold-300 2xl:text-base">{value}</div>
    </div>
  );
}

export default function HostLobby({
  t,
  roomCode,
  joinUrl,
  hostId,
  players,
  categoryId,
  level,
  questionCount,
  maxPlayers,
  language,
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
  maxPlayers: number;
  language: LangCode;
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
  const difficultyLabel = t.quiz.difficulty[difficultyForLevel(level)];
  const languageLabel = LANGUAGES.find((l) => l.code === language)?.nativeName ?? language;

  const connectedCount = players.filter((p) => isConnected(p.lastSeenAt)).length;
  const readyCount = players.filter((p) => p.isReady).length;

  const [copied, setCopied] = useState(false);
  async function handleCopyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to do
    }
  }

  const allPlayersReady = players.length > 0 && readyCount === players.length;

  return (
    <main
      className="min-h-screen w-full px-4 py-10 text-[#f3efe2] sm:px-8 lg:px-12"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      {/* max-w-6xl is comfortable on a monitor, but a lobby is meant to be
          read from across a room on a TV/projector — let it use more of a
          large display instead of sitting in a narrow column with empty
          space on both sides. */}
      <div className="mx-auto max-w-6xl 2xl:max-w-[1600px]">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500 2xl:text-sm">{tm.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl lg:text-5xl 2xl:text-6xl">{t.battle.title}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-purple-300 2xl:text-sm">{th.dashboardEyebrow}</p>
        </motion.header>

        {/* Players Connected / Ready Players / Maximum Players */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatTile icon="👥" label={th.playersConnectedLabel} value={String(connectedCount)} delay={0} reduceMotion={reduceMotion} />
          <StatTile
            icon="✅"
            label={th.readyPlayersLabel}
            value={`${readyCount}/${players.length}`}
            delay={0.05}
            reduceMotion={reduceMotion}
            emphasize={allPlayersReady}
          />
          <StatTile icon="🎟️" label={th.maximumPlayersLabel} value={String(maxPlayers)} delay={0.1} reduceMotion={reduceMotion} />
        </div>

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

            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-400 2xl:text-sm">{th.gameInformationHeading}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoTile label={tm.languageLabel} value={languageLabel} />
                <InfoTile label={tm.categoryLabel} value={categoryLabel} />
                <InfoTile label={tm.difficultyLabel} value={difficultyLabel} />
                <InfoTile label={th.questionCountLabel} value={String(questionCount)} />
              </div>
            </div>

            <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-premium 2xl:p-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-400 2xl:text-sm">{th.hostControlsHeading}</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  type="button"
                  onClick={onStart}
                  disabled={!canStart || isStarting}
                  whileHover={reduceMotion || !canStart ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={reduceMotion || !canStart ? undefined : { scale: 0.98 }}
                  className="flex-1 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-4 text-base font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-50 2xl:py-5 2xl:text-lg"
                >
                  {isStarting ? tm.startingBattle : th.startBattleButton}
                </motion.button>
                <button
                  type="button"
                  onClick={onEndRoom}
                  className="rounded-full border border-red-400/40 px-6 py-4 text-sm font-bold text-red-300 outline-none transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 2xl:py-5"
                >
                  {th.cancelRoomButton}
                </button>
                <motion.button
                  type="button"
                  onClick={handleCopyRoomCode}
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="rounded-full border border-white/15 bg-white/[0.03] px-6 py-4 text-sm font-bold text-[#c6cbd6] outline-none transition-colors hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 2xl:py-5"
                >
                  {copied ? `✓ ${tm.copiedMessage}` : `📋 ${tm.copyCodeButton}`}
                </motion.button>
              </div>
              <div
                role="status"
                aria-live="polite"
                className="mt-3 flex flex-col items-center justify-between gap-1 text-xs text-[#8d94a3] sm:flex-row"
              >
                <span>{th.readyCountLabel.replace("{ready}", String(readyCount)).replace("{total}", String(players.length))}</span>
                {!canStart && <span>{tm.minPlayersHint}</span>}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md 2xl:p-7">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#fbf6e8] 2xl:text-xl">{th.livePlayerListHeading}</h2>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#c6cbd6]">
                {th.connectedPlayersLabel.replace("{count}", String(players.length))}
              </span>
            </div>

            {players.length > 0 && (
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={false}
                  animate={{ width: `${(readyCount / players.length) * 100}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
                  className={`h-full rounded-full ${allPlayersReady ? "bg-emerald-400" : "bg-gold-400"}`}
                />
              </div>
            )}

            {players.length === 0 ? (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-10 text-center"
              >
                <motion.span
                  aria-hidden
                  className="text-3xl"
                  animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                  transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🕯️
                </motion.span>
                <p className="text-sm text-[#8d94a3]">{th.noPlayersYet}</p>
              </motion.div>
            ) : (
              <HostPlayerRoster
                players={players}
                hostId={hostId}
                hostLabel={tm.hostBadge}
                readyLabel={tm.readyBadge}
                waitingLabel={tm.waitingBadge}
                disconnectedLabel={t.battleShared.disconnectedLabel}
                scoreLabel={th.scoreLabel}
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
