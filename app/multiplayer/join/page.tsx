"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getSavedPlayerName, joinBattleRoom, RoomError } from "@/lib/liveBattleRoom";

function JoinBattleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const tm = t.multiplayerLobby;

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedName = getSavedPlayerName();
    if (savedName) setPlayerName(savedName);
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setRoomCode(
        codeFromUrl
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 6)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getErrorMessage(error: unknown): string {
    if (error instanceof RoomError) {
      if (error.code === "ROOM_NOT_FOUND") return tm.errorRoomNotFound;
      if (error.code === "ROOM_STARTED") return tm.errorRoomStarted;
      if (error.code === "ROOM_FULL") return tm.errorRoomFull;
    }
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }
    return tm.errorGeneric;
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = playerName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanName) {
      setStatus(tm.errorEnterName);
      return;
    }
    if (cleanCode.length !== 6) {
      setStatus(t.multiplayerPlayer.errorInvalidCode);
      return;
    }

    setIsLoading(true);
    setStatus(tm.joiningRoom);

    try {
      await joinBattleRoom({ code: cleanCode, playerName: cleanName, language: lang });
      router.push(`/multiplayer/play/${cleanCode}`);
    } catch (error: unknown) {
      console.error("Join room error:", error);
      setStatus(getErrorMessage(error));
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#f3efe2] outline-none transition-colors focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-4 py-12 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4 }}
        className="w-full max-w-sm rounded-card border border-purple-400/25 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md sm:p-8"
      >
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gold-500">{tm.eyebrow}</p>
        <h1 className="mt-2 text-center font-display text-2xl font-bold text-[#fbf6e8]">{tm.joinPageHeading}</h1>
        <p className="mt-2 text-center text-sm text-[#a7aebd]">{tm.joinPageSubheading}</p>

        <form onSubmit={handleJoin} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="join-room-code" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
              {tm.roomCodeLabel}
            </label>
            <input
              id="join-room-code"
              type="text"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6)
                )
              }
              placeholder={tm.roomCodePlaceholder}
              maxLength={6}
              autoFocus
              className={`${inputClass} text-center font-display text-xl font-bold uppercase tracking-[0.35em]`}
            />
          </div>

          <div>
            <label htmlFor="join-player-name" className="mb-1.5 block text-xs font-semibold text-[#c6cbd6]">
              {tm.playerNameLabel}
            </label>
            <input
              id="join-player-name"
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              maxLength={30}
              placeholder={tm.playerNamePlaceholder}
              className={inputClass}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={reduceMotion || isLoading ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion || isLoading ? undefined : { scale: 0.98 }}
            className="mt-1 w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-5 py-3.5 text-sm font-bold text-white shadow-purple outline-none transition-shadow hover:shadow-[0_0_36px_rgba(139,92,246,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? tm.joiningRoom : tm.joinRoomButton}
          </motion.button>
        </form>

        {status && (
          <motion.div
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-[#c6cbd6]"
          >
            {status}
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/multiplayer")}
            className="text-xs font-semibold text-[#8d94a3] underline decoration-dotted underline-offset-4 outline-none transition-colors hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            {tm.backToHome}
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function JoinBattlePage() {
  return (
    <Suspense fallback={null}>
      <JoinBattleForm />
    </Suspense>
  );
}
