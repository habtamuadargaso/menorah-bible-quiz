"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import { loadQuestionsForLevel } from "@/lib/questions/loadQuestions";
import { questionsForLevel } from "@/lib/questions";
import { difficultyForLevel } from "@/lib/levels";
import type { CategoryId } from "@/lib/categories";
import LobbyHeader from "@/components/multiplayer/LobbyHeader";
import RoomCard from "@/components/multiplayer/RoomCard";
import PlayerCard from "@/components/multiplayer/PlayerCard";
import ReadyButton from "@/components/multiplayer/ReadyButton";
import Countdown from "@/components/multiplayer/Countdown";
import InvitePanel from "@/components/multiplayer/InvitePanel";

const ROUND_SECONDS = 15;

type Room = {
  id: string;
  code: string;
  host_id: string;
  status: "waiting" | "playing" | "revealing" | "finished";
  current_question: number;
  max_players: number;
  language: LangCode;
  category_id: CategoryId;
  game_level: number;
};

type RoomPlayer = {
  id: string;
  room_id: string;
  player_id: string;
  display_name: string;
  score: number;
  is_ready: boolean;
  joined_at: string;
};

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t, setLang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const tm = t.multiplayerLobby;
  const roomCode = useMemo(() => String(params.code ?? "").toUpperCase(), [params.code]);

  function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      return String(error.message);
    }
    return tm.errorGeneric;
  }

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadLobby = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace("/multiplayer");
        return;
      }
      setCurrentUserId(user.id);

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, code, host_id, status, current_question, max_players, language, category_id, game_level")
        .eq("code", roomCode)
        .maybeSingle();
      if (roomError) throw roomError;
      if (!roomData) {
        setNotFound(true);
        return;
      }

      const typedRoom = roomData as Room;
      setRoom(typedRoom);
      setLang(typedRoom.language);

      const { data: playerData, error: playerError } = await supabase
        .from("room_players")
        .select("id, room_id, player_id, display_name, score, is_ready, joined_at")
        .eq("room_id", typedRoom.id)
        .order("joined_at", { ascending: true });
      if (playerError) throw playerError;
      setPlayers((playerData ?? []) as RoomPlayer[]);

      if (["playing", "revealing", "finished"].includes(typedRoom.status)) {
        router.replace(`/multiplayer/battle/${typedRoom.code}`);
        return;
      }

      setStatusMessage(
        typedRoom.host_id === user.id ? "" : tm.waitingForHost
      );
    } catch (error) {
      console.error("Lobby loading error:", error);
      setStatusMessage(getErrorMessage(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, router, setLang, tm.waitingForHost]);

  useEffect(() => {
    void loadLobby();
    const intervalId = window.setInterval(() => void loadLobby(), 1000);
    return () => window.clearInterval(intervalId);
  }, [loadLobby]);

  async function seedRoomQuestions(activeRoom: Room) {
    const supabase = createClient();
    let ids: string[] = [];

    try {
      const databaseQuestions = await loadQuestionsForLevel(activeRoom.game_level, activeRoom.language);
      ids = databaseQuestions.slice(0, 10).map((question) => question.id);
    } catch (error) {
      console.warn("Database question load failed; using local bank.", error);
    }

    if (ids.length < 10) {
      const local = questionsForLevel(activeRoom.language, activeRoom.category_id, activeRoom.game_level).questions;
      ids = local.slice(0, 10).map((question) => question.id);
    }
    if (ids.length < 10) {
      const english = questionsForLevel("en", activeRoom.category_id, activeRoom.game_level).questions;
      ids = english.slice(0, 10).map((question) => question.id);
    }
    if (ids.length < 10) {
      throw new Error("This level needs at least 10 questions before the battle can start.");
    }

    await supabase.from("room_questions").delete().eq("room_id", activeRoom.id);
    const rows = ids.map((questionId, index) => ({
      room_id: activeRoom.id,
      question_number: index + 1,
      question_id: questionId,
    }));
    const { error } = await supabase.from("room_questions").insert(rows);
    if (error) throw error;
  }

  async function startBattle() {
    if (!room || !currentUserId) return;
    if (room.host_id !== currentUserId) return;
    if (players.length < 2) return;

    setIsStarting(true);
    setStatusMessage(tm.startingBattle);
    try {
      const supabase = createClient();
      await seedRoomQuestions(room);
      const now = Date.now();
      const { error } = await supabase
        .from("rooms")
        .update({
          status: "playing",
          current_question: 1,
          question_started_at: new Date(now).toISOString(),
          question_ends_at: new Date(now + ROUND_SECONDS * 1000).toISOString(),
        })
        .eq("id", room.id)
        .eq("host_id", currentUserId);
      if (error) throw error;
      router.replace(`/multiplayer/battle/${room.code}`);
    } catch (error) {
      console.error("Start battle error:", error);
      setStatusMessage(getErrorMessage(error));
      setIsStarting(false);
      setShowCountdown(false);
    }
  }

  function handleStartClick() {
    if (!room || !currentUserId || room.host_id !== currentUserId) return;
    if (players.length < 2) {
      setStatusMessage(tm.minPlayersHint);
      return;
    }
    setShowCountdown(true);
  }

  async function toggleReady() {
    if (!room || !currentUserId) return;
    const me = players.find((p) => p.player_id === currentUserId);
    if (!me) return;
    const nextReady = !me.is_ready;
    setPlayers((prev) => prev.map((p) => (p.player_id === currentUserId ? { ...p, is_ready: nextReady } : p)));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("room_players")
        .update({ is_ready: nextReady })
        .eq("room_id", room.id)
        .eq("player_id", currentUserId);
      if (error) throw error;
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function leaveRoom() {
    if (!room || !currentUserId) {
      router.replace("/multiplayer");
      return;
    }
    setIsLeaving(true);
    try {
      const supabase = createClient();
      if (room.host_id === currentUserId) {
        const { error } = await supabase.from("rooms").delete().eq("id", room.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("room_players")
          .delete()
          .eq("room_id", room.id)
          .eq("player_id", currentUserId);
        if (error) throw error;
      }
      router.replace("/multiplayer");
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      setIsLeaving(false);
    }
  }

  const isHost = room?.host_id === currentUserId;
  const languageName = LANGUAGES.find((item) => item.code === room?.language)?.nativeName ?? "English";
  const categoryTitle = room ? t.categories[room.category_id]?.title ?? room.category_id : "";
  const difficultyLabel = room ? t.quiz.difficulty[difficultyForLevel(room.game_level)] : "";
  const hostName = players.find((p) => p.player_id === room?.host_id)?.display_name ?? tm.hostLabel;
  const me = players.find((p) => p.player_id === currentUserId);

  if (notFound) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-center text-[#f3efe2]"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <div>
          <p className="text-lg font-semibold">{tm.roomNotFoundMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/multiplayer")}
            className="mt-5 rounded-full border border-gold-500/45 px-6 py-3 text-sm font-bold text-gold-300 outline-none transition-colors hover:bg-gold-500/10"
          >
            {tm.backToHome}
          </button>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-center text-[#a7aebd]"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        {tm.loadingLobby}
      </main>
    );
  }

  return (
    <main
      className="min-h-screen w-full px-4 py-10 text-[#f3efe2] sm:px-8"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-3xl">
        <LobbyHeader
          eyebrow={tm.lobbyEyebrow}
          heading={tm.lobbyHeading}
          roomCode={roomCode}
          copyLabel={tm.copyCodeButton}
          copiedLabel={tm.copiedMessage}
          shareLabel={tm.shareButton}
        />

        <div className="mt-6">
          <RoomCard
            roomName={`${hostName}'s Room`}
            hostName={hostName}
            playerCount={players.length}
            maxPlayers={room.max_players}
            categoryTitle={categoryTitle}
            difficultyLabel={difficultyLabel}
            languageName={languageName}
            labels={{
              roomNameLabel: tm.roomNameLabel,
              hostLabel: tm.hostLabel,
              maxPlayersLabel: tm.maxPlayersLabel,
              categoryLabel: tm.categoryLabel,
              difficultyLabel: tm.difficultyLabel,
              languageLabel: tm.languageLabel,
              privacyLabel: tm.privacyLabel,
              privateRoomBadge: tm.privateRoomBadge,
            }}
          />
        </div>

        {players.length < 2 && (
          <div className="mt-6">
            <InvitePanel
              roomCode={roomCode}
              heading={tm.emptyStateHeading}
              body={tm.emptyStateBody}
              shareHint={tm.roomCodeShareHint}
              copyLabel={tm.copyCodeButton}
              copiedLabel={tm.copiedMessage}
              shareLabel={tm.shareButton}
            />
          </div>
        )}

        <motion.section
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4, delay: 0.1 }}
          className="mt-6 rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-premium backdrop-blur-md sm:p-7"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{tm.playersHeading}</h2>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#c6cbd6]">
              {players.length}/{room.max_players}
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  name={player.display_name}
                  isHost={player.player_id === room.host_id}
                  isReady={player.is_ready}
                  isYou={player.player_id === currentUserId}
                  hostLabel={tm.hostBadge}
                  readyLabel={tm.readyBadge}
                  waitingLabel={tm.waitingBadge}
                />
              ))}
            </AnimatePresence>
          </ul>
        </motion.section>

        {me && (
          <div className="mt-5">
            <ReadyButton
              isReady={me.is_ready}
              onToggle={toggleReady}
              readyLabel={tm.readyButton}
              notReadyLabel={tm.notReadyButton}
            />
          </div>
        )}

        {statusMessage && (
          <div role="status" className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-[#c6cbd6]">
            {statusMessage}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isHost ? (
            <motion.button
              type="button"
              onClick={handleStartClick}
              disabled={isStarting || players.length < 2}
              whileHover={reduceMotion || isStarting ? undefined : { y: -2, scale: 1.02 }}
              whileTap={reduceMotion || isStarting ? undefined : { scale: 0.98 }}
              className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-3.5 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? tm.startingBattle : tm.startButton}
            </motion.button>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-center text-sm text-[#a7aebd]">
              {tm.waitingForHost}
            </div>
          )}
          <motion.button
            type="button"
            onClick={leaveRoom}
            disabled={isLeaving}
            whileHover={reduceMotion || isLeaving ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion || isLeaving ? undefined : { scale: 0.98 }}
            className="rounded-full border border-red-400/40 px-5 py-3.5 text-sm font-semibold text-red-300 outline-none transition-colors hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:opacity-50"
          >
            {isLeaving ? tm.leavingRoom : isHost ? tm.cancelRoomButton : tm.leaveRoomButton}
          </motion.button>
        </div>

        {isHost && players.length < 2 && (
          <p className="mt-3 text-center text-xs text-[#8d94a3]">{tm.minPlayersHint}</p>
        )}
      </div>

      {showCountdown && <Countdown goLabel={tm.countdownGo} onComplete={() => void startBattle()} />}
    </main>
  );
}
