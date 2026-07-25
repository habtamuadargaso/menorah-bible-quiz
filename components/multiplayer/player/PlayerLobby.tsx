"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { UIStrings } from "@/lib/i18n/types";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import type { CategoryId } from "@/lib/categories";
import { difficultyForLevel } from "@/lib/levels";
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
  myLanguageCode,
  onChangeLanguage,
  level,
  categoryId,
}: {
  t: UIStrings;
  roomCode: string;
  playerName: string;
  hostId: string;
  myPlayerId: string;
  players: RoomPlayerState[];
  isReady: boolean;
  onToggleReady: () => void;
  myLanguageCode: LangCode;
  onChangeLanguage: (languageCode: LangCode) => void;
  level: number;
  categoryId: CategoryId;
}) {
  const reduceMotion = useReducedMotion();
  const tm = t.multiplayerLobby;
  const tp = t.multiplayerPlayer;
  const categoryLabel = t.categories[categoryId]?.title ?? categoryId;
  const difficultyLabel = t.quiz.difficulty[difficultyForLevel(level)];

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

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tm.levelLabel}</div>
            <div className="mt-0.5 font-display text-sm font-bold text-gold-300">{level}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tm.categoryLabel}</div>
            <div className="mt-0.5 truncate font-display text-sm font-bold text-gold-300">{categoryLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa1b0]">{tm.difficultyLabel}</div>
            <div className="mt-0.5 font-display text-sm font-bold text-gold-300">{difficultyLabel}</div>
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 text-center shadow-premium">
          <p className="text-sm text-[#a7aebd]">{tm.waitingForHost}</p>
        </div>

        <div className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-premium">
          <label htmlFor="player-lobby-language" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9aa1b0]">
            {tm.yourLanguageLabel}
          </label>
          <select
            id="player-lobby-language"
            value={myLanguageCode}
            onChange={(event) => onChangeLanguage(event.target.value as LangCode)}
            className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f3efe2] outline-none transition-colors focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code} className="bg-navy-950 text-[#f3efe2]">
                {language.flag} {language.nativeName} ({language.englishName})
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[#8d94a3]">{tm.languageLockedHint}</p>
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
