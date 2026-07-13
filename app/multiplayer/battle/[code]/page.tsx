"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function generateRoomCode(length = 6): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length }, () => {
    return characters[Math.floor(Math.random() * characters.length)];
  }).join("");
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

  return "Something went wrong. Please try again.";
}

export default function MultiplayerPage() {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingPlayer, setIsSwitchingPlayer] =
    useState(false);

  useEffect(() => {
    const savedName = window.localStorage.getItem(
      "menorah-player-name"
    );

    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  async function getAuthenticatedUser() {
    const supabase = createClient();

    const {
      data: { user: currentUser },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (currentUser) {
      return {
        supabase,
        user: currentUser,
      };
    }

    if (getUserError) {
      console.info(
        "No current guest session:",
        getUserError.message
      );
    }

    const { data, error } =
      await supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Unable to create guest player.");
    }

    return {
      supabase,
      user: data.user,
    };
  }

  async function ensurePlayerProfile(
    name: string
  ): Promise<{
    supabase: ReturnType<typeof createClient>;
    userId: string;
  }> {
    const { supabase, user } =
      await getAuthenticatedUser();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: name,
          language: "en",
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      throw error;
    }

    window.localStorage.setItem(
      "menorah-player-name",
      name
    );

    return {
      supabase,
      userId: user.id,
    };
  }

  async function switchPlayer() {
    setIsSwitchingPlayer(true);
    setStatus("Creating a new guest player...");

    try {
      const supabase = createClient();

      const { error: signOutError } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (signOutError) {
        throw signOutError;
      }

      window.localStorage.removeItem(
        "menorah-player-name"
      );

      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error(
          "Unable to create a new guest player."
        );
      }

      setPlayerName("");
      setRoomCode("");
      setStatus(
        "New player session created. Enter a new player name."
      );
    } catch (error: unknown) {
      console.error("Switch player error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsSwitchingPlayer(false);
    }
  }

  async function handleCreateRoom(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = playerName.trim();

    if (!cleanName) {
      setStatus("Please enter your player name.");
      return;
    }

    setIsLoading(true);
    setStatus("Creating your room...");

    try {
      const { supabase, userId } =
        await ensurePlayerProfile(cleanName);

      let createdRoom:
        | {
            id: string;
            code: string;
          }
        | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const generatedCode = generateRoomCode();

        const { data, error } = await supabase
          .from("rooms")
          .insert({
            code: generatedCode,
            host_id: userId,
            category_id: "old-testament",
            game_level: 1,
            language: "en",
            status: "waiting",
            current_question: 0,
            max_players: 8,
          })
          .select("id, code")
          .single();

        if (!error && data) {
          createdRoom = data;
          break;
        }

        if (error && error.code !== "23505") {
          throw error;
        }
      }

      if (!createdRoom) {
        throw new Error(
          "Unable to generate a unique room code. Please try again."
        );
      }

      const { error: playerError } = await supabase
        .from("room_players")
        .insert({
          room_id: createdRoom.id,
          player_id: userId,
          display_name: cleanName,
          score: 0,
          is_ready: true,
        });

      if (playerError) {
        await supabase
          .from("rooms")
          .delete()
          .eq("id", createdRoom.id);

        throw playerError;
      }

      router.push(
        `/multiplayer/lobby/${createdRoom.code}`
      );
    } catch (error: unknown) {
      console.error("Create room error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinRoom(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = playerName.trim();
    const cleanCode = roomCode
      .trim()
      .toUpperCase();

    if (!cleanName) {
      setStatus("Please enter your player name.");
      return;
    }

    if (cleanCode.length !== 6) {
      setStatus("Enter the 6-character room code.");
      return;
    }

    setIsLoading(true);
    setStatus("Finding the room...");

    try {
      const { supabase, userId } =
        await ensurePlayerProfile(cleanName);

      const { data: room, error: roomError } =
        await supabase
          .from("rooms")
          .select(
            "id, code, host_id, status, max_players"
          )
          .eq("code", cleanCode)
          .maybeSingle();

      if (roomError) {
        throw roomError;
      }

      if (!room) {
        throw new Error(
          "Room not found. Check the code and try again."
        );
      }

      if (room.status !== "waiting") {
        throw new Error(
          "This game has already started."
        );
      }

      const { count, error: countError } =
        await supabase
          .from("room_players")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("room_id", room.id);

      if (countError) {
        throw countError;
      }

      if (
        typeof count === "number" &&
        count >= room.max_players
      ) {
        throw new Error("This room is full.");
      }

      const { error: joinError } = await supabase
        .from("room_players")
        .upsert(
          {
            room_id: room.id,
            player_id: userId,
            display_name: cleanName,
            score: 0,
            is_ready: true,
          },
          {
            onConflict: "room_id,player_id",
          }
        );

      if (joinError) {
        throw joinError;
      }

      router.push(
        `/multiplayer/lobby/${cleanCode}`
      );
    } catch (error: unknown) {
      console.error("Join room error:", error);
      setStatus(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Menorah Bible Quiz
          </p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            Online Bible Battle
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Create a room or join your family,
            friends, or church members using a room
            code.
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
          <label
            htmlFor="player-name"
            className="mb-2 block font-semibold"
          >
            Player name
          </label>

          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(event) =>
              setPlayerName(event.target.value)
            }
            maxLength={30}
            placeholder="Enter your name"
            className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400"
          />

          <button
            type="button"
            onClick={switchPlayer}
            disabled={
              isLoading || isSwitchingPlayer
            }
            className="mt-4 w-full rounded-xl border border-red-400/40 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSwitchingPlayer
              ? "Switching Player..."
              : "Change / Switch Player"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            Use this when testing multiple players in
            the same browser.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={handleCreateRoom}
            className="rounded-3xl border border-amber-400/40 bg-amber-400/10 p-7"
          >
            <div className="mb-4 text-4xl">
              👑
            </div>

            <h2 className="text-2xl font-bold">
              Create Room
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Become the host and invite other players
              using your room code.
            </p>

            <button
              type="submit"
              disabled={
                isLoading || isSwitchingPlayer
              }
              className="mt-7 w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Please wait..."
                : "Create Battle Room"}
            </button>
          </form>

          <form
            onSubmit={handleJoinRoom}
            className="rounded-3xl border border-blue-400/30 bg-blue-400/10 p-7"
          >
            <div className="mb-4 text-4xl">
              ⚔️
            </div>

            <h2 className="text-2xl font-bold">
              Join Room
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Enter the six-character code shared by
              the room host.
            </p>

            <label
              htmlFor="room-code"
              className="sr-only"
            >
              Room code
            </label>

            <input
              id="room-code"
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
              placeholder="ABC123"
              maxLength={6}
              className="mt-5 w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-center text-xl font-bold uppercase tracking-[0.35em] outline-none focus:border-blue-400"
            />

            <button
              type="submit"
              disabled={
                isLoading || isSwitchingPlayer
              }
              className="mt-4 w-full rounded-xl bg-blue-500 px-5 py-3 font-bold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Please wait..."
                : "Join Battle Room"}
            </button>
          </form>
        </div>

        {status && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm"
          >
            {status}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}