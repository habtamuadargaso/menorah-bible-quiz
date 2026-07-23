"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { UIStrings } from "@/lib/i18n/types";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import {
  FRIENDS_BATTLE_DEFAULT_DIFFICULTY,
  FRIENDS_BATTLE_MAX_PLAYERS,
  FRIENDS_BATTLE_MIN_PLAYERS,
  friendsBattleDifficultyLabel,
  type Difficulty,
} from "@/lib/friendsBattle/types";
import { hasEnoughFriendsBattleContent, wouldUseDifficultyFallback } from "@/lib/friendsBattle/localQuestions";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);
const PLAYER_COUNTS = Array.from(
  { length: FRIENDS_BATTLE_MAX_PLAYERS - FRIENDS_BATTLE_MIN_PLAYERS + 1 },
  (_, i) => i + FRIENDS_BATTLE_MIN_PLAYERS
);
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function FriendsBattleSetup({
  t,
  onStart,
}: {
  t: UIStrings;
  onStart: (input: { language: LangCode; level: number; difficulty: Difficulty; playerNames: string[] }) => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const tf = t.friendsBattle;

  const [language, setLanguage] = useState<LangCode>("en");
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(FRIENDS_BATTLE_DEFAULT_DIFFICULTY);
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);

  const languageInfo = useMemo(() => LANGUAGES.find((l) => l.code === language), [language]);
  const contentAvailable = hasEnoughFriendsBattleContent(language);
  const willFallbackDifficulty = contentAvailable && wouldUseDifficultyFallback(language, difficulty);

  function updatePlayerCount(next: number) {
    setPlayerCount(next);
    setNames((prev) => {
      const copy = [...prev];
      while (copy.length < next) copy.push("");
      copy.length = next;
      return copy;
    });
  }

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = names.map((n) => n.trim());

    if (trimmed.length < FRIENDS_BATTLE_MIN_PLAYERS) {
      setError(tf.errorMinPlayers);
      return;
    }
    if (trimmed.length > FRIENDS_BATTLE_MAX_PLAYERS) {
      setError(tf.errorMaxPlayers);
      return;
    }
    if (trimmed.some((n) => n.length === 0)) {
      setError(tf.errorEmptyName);
      return;
    }
    // Duplicate names are handled gracefully by disambiguating rather than
    // blocking the match: two friends both named "Sam" is a completely
    // normal real-world case for pass-and-play.
    const seen = new Map<string, number>();
    const deduped = trimmed.map((n) => {
      const key = n.toLowerCase();
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      return count === 0 ? n : `${n} (${count + 1})`;
    });

    if (!contentAvailable) {
      setError(tf.errorContentUnavailable.replace("{language}", languageInfo?.englishName ?? language));
      return;
    }

    onStart({ language, level, difficulty, playerNames: deduped });
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f3efe2] outline-none transition-colors focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";

  return (
    <main
      className="min-h-screen w-full px-4 py-12 text-[#f3efe2] sm:px-8"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-2xl">
        <OfflineBanner mode="reassure" reassureText={t.offline.friendsBattleReassurance} blockText="" />
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-4xl font-bold text-[#fbf6e8]">{tf.setupHeading}</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#a7aebd]">{tf.setupDescription}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {[
              tf.badgeOneDevice,
              tf.badgePassAndPlay,
              tf.badgePlayerRange,
              tf.badgeOfflineReady,
              tf.badgeNoRoomCode,
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[11px] font-bold text-gold-300"
              >
                ✔ {badge}
              </span>
            ))}
          </div>
        </motion.header>

        <motion.form
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="fb-language" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tf.languageLabel}
              </label>
              <select
                id="fb-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LangCode)}
                className={inputClass}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-navy-900">
                    {l.nativeName} — {l.englishName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fb-level" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tf.levelLabel}
              </label>
              <select
                id="fb-level"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className={inputClass}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-navy-900">
                    {tf.levelOptionLabel.replace("{n}", String(lvl))}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fb-difficulty" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tf.difficultyLabel}
              </label>
              <select
                id="fb-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className={inputClass}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="bg-navy-900">
                    {friendsBattleDifficultyLabel(t, d)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fb-player-count" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tf.playerCountLabel}
              </label>
              <select
                id="fb-player-count"
                value={playerCount}
                onChange={(e) => updatePlayerCount(Number(e.target.value))}
                className={inputClass}
              >
                {PLAYER_COUNTS.map((n) => (
                  <option key={n} value={n} className="bg-navy-900">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {willFallbackDifficulty && (
            <p
              role="status"
              data-testid="fb-difficulty-fallback-notice"
              className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/10 px-4 py-2.5 text-xs text-gold-200"
            >
              {tf.difficultyFallbackNotice.replace("{difficulty}", friendsBattleDifficultyLabel(t, difficulty))}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {names.map((name, index) => (
              <div key={index}>
                <label htmlFor={`fb-player-${index}`} className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                  {tf.playerNameLabel.replace("{n}", String(index + 1))}
                </label>
                <input
                  id={`fb-player-${index}`}
                  type="text"
                  value={name}
                  onChange={(e) => updateName(index, e.target.value)}
                  maxLength={30}
                  placeholder={tf.playerNamePlaceholder.replace("{n}", String(index + 1))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="mt-6 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tf.startButton}
          </motion.button>
        </motion.form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tf.backToHome}
          </button>
        </div>
      </div>
    </main>
  );
}
