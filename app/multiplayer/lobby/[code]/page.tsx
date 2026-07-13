"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import { loadQuestionsForLevel } from "@/lib/questions/loadQuestions";
import { questionsForLevel } from "@/lib/questions";
import type { CategoryId } from "@/lib/categories";

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

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Something went wrong.";
}

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { setLang } = useLanguage();
  const roomCode = useMemo(() => String(params.code ?? "").toUpperCase(), [params.code]);

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading lobby...");
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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
        setStatusMessage("Room not found.");
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
        typedRoom.host_id === user.id
          ? "Players are ready. Start when at least two players have joined."
          : "Waiting for the host to start the battle."
      );
    } catch (error) {
      console.error("Lobby loading error:", error);
      setStatusMessage(getErrorMessage(error));
    }
  }, [roomCode, router, setLang]);

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
      const local = questionsForLevel(
        activeRoom.language,
        activeRoom.category_id,
        activeRoom.game_level
      ).questions;
      ids = local.slice(0, 10).map((question) => question.id);
    }

    if (ids.length < 10) {
      const english = questionsForLevel(
        "en",
        activeRoom.category_id,
        activeRoom.game_level
      ).questions;
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
    if (room.host_id !== currentUserId) {
      setStatusMessage("Only the room host can start the battle.");
      return;
    }
    if (players.length < 2) {
      setStatusMessage("At least two players are required to start.");
      return;
    }

    setIsStarting(true);
    setStatusMessage("Preparing the same 10 questions for every player...");
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

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Waiting Lobby</p>
          <h1 className="mt-3 text-4xl font-bold">Bible Battle</h1>
          <p className="mt-4 text-slate-300">Language: <strong>{languageName}</strong></p>
          <p className="mt-3 text-slate-300">Share this room code:</p>
          <div className="mx-auto mt-3 inline-flex rounded-2xl border border-amber-400/50 bg-amber-400/10 px-8 py-4 text-3xl font-black tracking-[0.35em] text-amber-300">{roomCode}</div>
        </header>

        <section className="mt-10 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Players</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{players.length}/{room?.max_players ?? 8}</span>
          </div>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-400 font-bold text-slate-950">{index + 1}</div>
                  <div>
                    <p className="font-semibold">{player.display_name}</p>
                    <p className="text-xs text-slate-400">{player.player_id === room?.host_id ? "Room host" : "Player"}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">Ready ✓</span>
              </div>
            ))}
          </div>
        </section>

        <div role="status" className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-slate-300">{statusMessage}</div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isHost ? (
            <button type="button" onClick={startBattle} disabled={isStarting || players.length < 2} className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
              {isStarting ? "Starting Battle..." : "Start Battle"}
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-slate-300">Waiting for host</div>
          )}
          <button type="button" onClick={leaveRoom} disabled={isLeaving} className="rounded-xl border border-red-400/40 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50">{isLeaving ? "Leaving..." : "Leave Room"}</button>
        </div>
      </div>
    </main>
  );
}
