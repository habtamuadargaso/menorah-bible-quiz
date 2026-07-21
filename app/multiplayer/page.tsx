"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import HomeOptionCard from "@/components/multiplayer/HomeOptionCard";
import { createBattleRoom, fetchRoomById, getSavedPlayerName, seedRoomQuestions } from "@/lib/liveBattleRoom";

// A difficulty picker maps to a representative campaign level — the rooms
// table only stores game_level (unchanged schema), so "Difficulty" here is
// just a friendlier label over that same existing column.
const DIFFICULTY_LEVELS: Array<{ id: "Easy" | "Medium" | "Hard"; level: number }> = [
  { id: "Easy", level: 1 },
  { id: "Medium", level: 4 },
  { id: "Hard", level: 8 },
];

const MAX_PLAYER_OPTIONS = [2, 4, 6, 8, 12];

export default function MultiplayerPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const tm = t.multiplayerLobby;

  function getErrorMessage(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
    return tm.errorGeneric;
  }

  const [playerName, setPlayerName] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("old-testament");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingPlayer, setIsSwitchingPlayer] = useState(false);

  useEffect(() => {
    const savedName = getSavedPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  async function switchPlayer() {
    setIsSwitchingPlayer(true);
    setStatus(tm.switchingPlayer);
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;

      window.localStorage.removeItem("menorah-player-name");
      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Unable to create a new guest player.");

      setPlayerName("");
      setStatus("");
    } catch (error: unknown) {
      console.error("Switch player error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsSwitchingPlayer(false);
    }
  }

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setStatus(tm.errorEnterName);
      return;
    }

    setIsLoading(true);
    setStatus(tm.creatingRoom);

    try {
      const selectedLevel = DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.level ?? 1;
      console.log("===== handleCreateRoom =====");
      console.log({
        requestedLevel: selectedLevel,
        requestedLanguage: lang,
        requestedCategory: categoryId,
        requestedDifficulty: difficulty,
      });
      const { code, roomId } = await createBattleRoom({
        hostName: cleanName,
        categoryId,
        level: selectedLevel,
        language: lang,
        maxPlayers,
      });

      const room = await fetchRoomById(roomId);
      if (room) {
        await seedRoomQuestions(room);
      }

      router.push(`/multiplayer/host/${code}`);
    } catch (error: unknown) {
      console.error("Create room error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f3efe2] outline-none transition-colors focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";

  return (
    <main
      className="min-h-screen w-full px-4 py-12 text-[#f3efe2] sm:px-8"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
          className="mb-10 text-center"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-gold-500">{tm.eyebrow}</p>
          <h1 className="font-display text-4xl font-bold text-[#fbf6e8] sm:text-5xl">{tm.heading}</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#a7aebd]">{tm.subheading}</p>
        </motion.header>

        {/* player setup */}
        <motion.section
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.1 }}
          className="mb-6 rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md sm:p-7"
        >
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{tm.playerSetupHeading}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="player-name" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tm.playerNameLabel}
              </label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                maxLength={30}
                placeholder={tm.playerNamePlaceholder}
                className={selectClass}
              />
            </div>
            <div>
              <label htmlFor="battle-language" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
                {tm.languageLabel}
              </label>
              <select
                id="battle-language"
                value={lang}
                onChange={(event) => setLang(event.target.value as LangCode)}
                className={selectClass}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code} className="bg-navy-900">
                    {language.nativeName} — {language.englishName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={switchPlayer}
            disabled={isLoading || isSwitchingPlayer}
            className="mt-4 text-xs font-semibold text-[#8d94a3] underline decoration-dotted underline-offset-4 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSwitchingPlayer ? tm.switchingPlayer : tm.switchPlayerButton}
          </button>
          <p className="mt-1 text-[11px] text-[#6b7284]">{tm.switchPlayerHint}</p>
        </motion.section>

        <div className="grid gap-6 md:grid-cols-3">
          <form onSubmit={handleCreateRoom}>
            <HomeOptionCard icon="👑" title={tm.createRoomTitle} description={tm.createRoomDescription} tone="gold" delay={0.15}>
              <div className="grid gap-3">
                <div>
                  <label htmlFor="create-category" className="mb-1 block text-[11px] font-semibold text-[#c6cbd6]">
                    {tm.categoryLabel}
                  </label>
                  <select
                    id="create-category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value as CategoryId)}
                    className={selectClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-navy-900">
                        {t.categories[c.id]?.title ?? c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="create-difficulty" className="mb-1 block text-[11px] font-semibold text-[#c6cbd6]">
                      {tm.difficultyLabel}
                    </label>
                    <select
                      id="create-difficulty"
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value as "Easy" | "Medium" | "Hard")}
                      className={selectClass}
                    >
                      {DIFFICULTY_LEVELS.map((d) => (
                        <option key={d.id} value={d.id} className="bg-navy-900">
                          {t.quiz.difficulty[d.id]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="create-max-players" className="mb-1 block text-[11px] font-semibold text-[#c6cbd6]">
                      {tm.maxPlayersLabel}
                    </label>
                    <select
                      id="create-max-players"
                      value={maxPlayers}
                      onChange={(event) => setMaxPlayers(Number(event.target.value))}
                      className={selectClass}
                    >
                      {MAX_PLAYER_OPTIONS.map((n) => (
                        <option key={n} value={n} className="bg-navy-900">
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || isSwitchingPlayer}
                whileHover={reduceMotion || isLoading ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduceMotion || isLoading ? undefined : { scale: 0.98 }}
                className="mt-4 w-full rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? tm.creatingRoom : tm.createRoomButton}
              </motion.button>
            </HomeOptionCard>
          </form>

          <HomeOptionCard icon="⚔️" title={tm.joinRoomTitle} description={tm.joinRoomDescription} tone="purple" delay={0.2}>
            <motion.button
              type="button"
              onClick={() => router.push("/multiplayer/join")}
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="mt-4 w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-5 py-3.5 text-sm font-bold text-white shadow-purple outline-none transition-shadow hover:shadow-[0_0_36px_rgba(139,92,246,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              {tm.joinRoomButton}
            </motion.button>
          </HomeOptionCard>

          <HomeOptionCard
            icon="⚡"
            title={tm.quickMatchTitle}
            description={tm.quickMatchDescription}
            tone="purple"
            comingSoon
            comingSoonLabel={t.common.comingSoon}
            delay={0.25}
          />
        </div>

        {status && (
          <motion.div
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm text-[#c6cbd6]"
          >
            {status}
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tm.backToHome}
          </button>
        </div>
      </div>
    </main>
  );
}
