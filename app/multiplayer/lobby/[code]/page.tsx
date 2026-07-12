"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nativeQuestionBank } from "@/lib/questions";
import { shuffle } from "@/lib/shuffle";

type Room = {
  id: string;
  code: string;
  host_id: string;
  status: string;
  max_players: number;
  language?: string;
  category_id?: string;
  game_level?: number;
};

type RoomPlayer = {
  id: string;
  player_id: string;
  display_name: string;
  score: number;
  is_ready: boolean;
  joined_at: string;
};

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<Room | null>(
    null
  );
  const [players, setPlayers] = useState<
    RoomPlayer[]
  >([]);
  const [currentUserId, setCurrentUserId] =
    useState("");
  const [status, setStatus] = useState(
    "Loading lobby..."
  );
  const [isStarting, setIsStarting] =
    useState(false);

  const loadLobby = useCallback(async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/multiplayer");
        return;
      }

      setCurrentUserId(user.id);

      const { data: roomData, error: roomError } =
        await supabase
          .from("rooms")
          .select(
            "id, code, host_id, status, max_players, language, category_id, game_level"
          )
          .eq("code", code)
          .maybeSingle();

      if (roomError) {
        throw roomError;
      }

      if (!roomData) {
        throw new Error("Room not found.");
      }

      setRoom(roomData);

      const {
        data: playerData,
        error: playersError,
      } = await supabase
        .from("room_players")
        .select(
          "id, player_id, display_name, score, is_ready, joined_at"
        )
        .eq("room_id", roomData.id)
        .order("joined_at", {
          ascending: true,
        });

      if (playersError) {
        throw playersError;
      }

      setPlayers(playerData ?? []);

      if (roomData.status === "playing") {
        setStatus("The battle is starting...");
        router.replace(`/multiplayer/battle/${code}`);
      } else {
        setStatus(
          "Waiting for the host to start."
        );
      }
    } catch (error: unknown) {
      console.error("Lobby error:", error);
      setStatus(getErrorMessage(error));
    }
  }, [code, router]);

  useEffect(() => {
    loadLobby();

    const intervalId = window.setInterval(
      loadLobby,
      2000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadLobby]);

  async function startGame() {
    if (!room) {
      return;
    }

    if (players.length < 2) {
      setStatus(
        "At least two players are required."
      );
      return;
    }

    setIsStarting(true);

    try {
      const supabase = createClient();

      const language = room.language === "am" ? "am" : "en";
      const bank = nativeQuestionBank(language);

      if (bank.length < 10) {
        throw new Error("This language needs at least 10 reviewed questions before online battle can start.");
      }

      const selected = shuffle(bank).slice(0, 10);

      await supabase.from("room_questions").delete().eq("room_id", room.id);
      await supabase.from("answers").delete().eq("room_id", room.id);

      const { error: questionError } = await supabase.from("room_questions").insert(
        selected.map((question, index) => ({
          room_id: room.id,
          question_number: index + 1,
          question_id: question.id,
        }))
      );

      if (questionError) throw questionError;

      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + 15000);
      const { error } = await supabase
        .from("rooms")
        .update({
          status: "playing",
          current_question: 1,
          question_started_at: startedAt.toISOString(),
          question_ends_at: endsAt.toISOString(),
        })
        .eq("id", room.id);

      if (error) throw error;
      router.push(`/multiplayer/battle/${code}`);
    } catch (error: unknown) {
      console.error("Start game error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsStarting(false);
    }
  }

  async function leaveRoom() {
    if (!room || !currentUserId) {
      router.push("/multiplayer");
      return;
    }

    const supabase = createClient();

    await supabase
      .from("room_players")
      .delete()
      .eq("room_id", room.id)
      .eq("player_id", currentUserId);

    router.push("/multiplayer");
  }

  const isHost =
    room?.host_id === currentUserId;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Waiting Lobby
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Bible Battle
          </h1>

          <p className="mt-5 text-slate-300">
            Share this room code:
          </p>

          <div className="mx-auto mt-3 inline-flex rounded-2xl border border-amber-400/50 bg-amber-400/10 px-8 py-4 text-3xl font-black tracking-[0.35em] text-amber-300">
            {code}
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Players
            </h2>

            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
              {players.length}/
              {room?.max_players ?? 8}
            </span>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-400 font-bold text-slate-950">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {player.display_name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {player.player_id ===
                      room?.host_id
                        ? "Room host"
                        : "Player"}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold text-emerald-400">
                  Ready ✓
                </span>
              </div>
            ))}

            {players.length === 0 && (
              <p className="py-8 text-center text-slate-400">
                No players have joined yet.
              </p>
            )}
          </div>
        </section>

        <div
          role="status"
          className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-slate-300"
        >
          {status}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={
                isStarting ||
                players.length < 2
              }
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting
                ? "Starting..."
                : "Start Battle"}
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-slate-300">
              Waiting for host
            </div>
          )}

          <button
            type="button"
            onClick={leaveRoom}
            className="rounded-xl border border-red-400/40 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/10"
          >
            Leave Room
          </button>
        </div>
      </div>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong.";
}