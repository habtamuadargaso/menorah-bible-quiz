"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import type { RoomPlayerState } from "@/lib/liveBattleRoom";
import ConnectedPlayerList from "../shared/ConnectedPlayerList";
import ReadyButton from "../ReadyButton";

export default function PlayerLobby({
  t,
  roomCode,
  playerName,
  hostId,
  myPlayerId,
  players,
  isReady,
  onToggleReady,
}: {
  t: UIStrings;
  roomCode: string;
  playerName: string;
  hostId: string;
  myPlayerId: string;
  players: RoomPlayerState[];
  isReady: boolean;
  onToggleReady: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tm = t.multiplayerLobby;
  const tp = t.multiplayerPlayer;

  return (
    <main
      className="min-h-screen w-full px-4 py-8 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-500">{tm.eyebrow}</p>
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-2xl border border-gold-500/40 bg-gold-500/10 px-6 py-2.5">
            <span className="font-display text-2xl font-black tracking-[0.3em] text-gold-300">{roomCode}</span>
          </div>
          <p className="mt-3 text-sm text-[#c6cbd6]">{tp.joinedAsLabel.replace("{name}", playerName)}</p>
        </motion.header>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 text-center shadow-premium">
          <p className="text-sm text-[#a7aebd]">{tm.waitingForHost}</p>
        </div>

        <ReadyButton
          isReady={isReady}
          onToggle={onToggleReady}
          readyLabel={tm.readyButton}
          notReadyLabel={tm.notReadyButton}
        />

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-premium">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#fbf6e8]">{tp.connectedPlayersHeading}</h2>
            <span className="text-xs font-bold text-[#9aa1b0]">{players.length}</span>
          </div>
          <ConnectedPlayerList
            players={players}
            hostId={hostId}
            myPlayerId={myPlayerId}
            hostLabel={tm.hostBadge}
            readyLabel={tm.readyBadge}
            waitingLabel={tm.waitingBadge}
            disconnectedLabel={t.battleShared.disconnectedLabel}
          />
        </div>
      </div>
    </main>
  );
}
