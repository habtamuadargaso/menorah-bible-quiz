"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  ensureAnonymousSession,
  fetchMyAnswers,
  fetchRoomByCode,
  fetchRoomPlayers,
  fetchRoomQuestion,
  getSavedPlayerName,
  isConnected,
  joinBattleRoom,
  leaveRoom,
  resolveRoundIfExpired,
  startHeartbeat,
  submitAnswer,
  toggleReady,
  RoomError,
  type AnswerRow,
  type RoomPlayerState,
  type RoomQuestionView,
  type RoomState,
} from "@/lib/liveBattleRoom";
import Countdown from "@/components/multiplayer/Countdown";
import PlayerLobby from "@/components/multiplayer/player/PlayerLobby";
import PlayerQuestion from "@/components/multiplayer/player/PlayerQuestion";
import PlayerRoundResult from "@/components/multiplayer/player/PlayerRoundResult";
import PlayerFinalResult from "@/components/multiplayer/player/PlayerFinalResult";
import HostLeaderboard from "@/components/multiplayer/host/HostLeaderboard";

export default function PlayerRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const code = (params.code ?? "").toUpperCase();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<RoomPlayerState[]>([]);
  const [question, setQuestion] = useState<RoomQuestionView | null>(null);
  const [myAnswers, setMyAnswers] = useState<AnswerRow[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<"connected" | "reconnecting" | "disconnected">("reconnecting");

  const refreshPlayers = useCallback(async (roomId: string) => {
    try {
      setPlayers(await fetchRoomPlayers(roomId));
    } catch (err) {
      console.error("Failed to refresh players:", err);
    }
  }, []);

  const refreshQuestion = useCallback(async (roomId: string, lang: RoomState["language"]) => {
    try {
      setQuestion(await fetchRoomQuestion(roomId, lang));
    } catch (err) {
      console.error("Failed to load question:", err);
    }
  }, []);

  const refreshMyAnswers = useCallback(async (roomId: string, playerId: string) => {
    try {
      setMyAnswers(await fetchMyAnswers(roomId, playerId));
    } catch (err) {
      console.error("Failed to load my answers:", err);
    }
  }, []);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let stopHeartbeat: (() => void) | null = null;

    async function init() {
      try {
        const { userId } = await ensureAnonymousSession();
        if (cancelled) return;

        const initialRoom = await fetchRoomByCode(code);
        if (!initialRoom) {
          setError(t.multiplayerLobby.roomNotFoundMessage);
          setIsLoading(false);
          return;
        }

        const existingPlayers = await fetchRoomPlayers(initialRoom.id);
        let mine = existingPlayers.find((p) => p.playerId === userId);

        if (!mine) {
          const savedName = getSavedPlayerName();
          if (!savedName) {
            router.replace(`/multiplayer/join?code=${initialRoom.code}`);
            return;
          }
          try {
            await joinBattleRoom({ code: initialRoom.code, playerName: savedName, language: initialRoom.language });
          } catch (err) {
            if (err instanceof RoomError) {
              setError(
                err.code === "ROOM_STARTED"
                  ? t.multiplayerLobby.errorRoomStarted
                  : err.code === "ROOM_FULL"
                    ? t.multiplayerLobby.errorRoomFull
                    : t.multiplayerLobby.errorRoomNotFound
              );
            } else {
              setError(t.multiplayerLobby.errorGeneric);
            }
            setIsLoading(false);
            return;
          }
          const refreshed = await fetchRoomPlayers(initialRoom.id);
          mine = refreshed.find((p) => p.playerId === userId);
          setPlayers(refreshed);
        } else {
          setPlayers(existingPlayers);
        }

        if (cancelled) return;
        setMyPlayerId(userId);
        setPlayerName(mine?.displayName ?? getSavedPlayerName());
        setRoom(initialRoom);

        if (initialRoom.status === "question" || initialRoom.status === "reveal") {
          await refreshQuestion(initialRoom.id, initialRoom.language);
        }
        if (initialRoom.status !== "waiting") {
          await refreshMyAnswers(initialRoom.id, userId);
        }
        stopHeartbeat = startHeartbeat(initialRoom.id, userId);
        setIsLoading(false);

        const supabase = createClient();
        const channel = supabase
          .channel(`player-room-${initialRoom.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "rooms", filter: `id=eq.${initialRoom.id}` },
            async (payload) => {
              const row = payload.new as Record<string, unknown>;
              if (!row || payload.eventType === "DELETE") {
                setError(t.multiplayerPlayer.errorExpiredRoom);
                return;
              }
              const nextStatus = row.status as RoomState["status"];
              setRoom((prev) =>
                prev
                  ? {
                      ...prev,
                      status: nextStatus,
                      currentQuestion: row.current_question as number,
                      questionStartedAt: row.question_started_at as string | null,
                      questionEndsAt: row.question_ends_at as string | null,
                    }
                  : prev
              );
              if (nextStatus === "question") {
                await refreshQuestion(initialRoom.id, initialRoom.language);
              } else if (nextStatus === "reveal") {
                await refreshQuestion(initialRoom.id, initialRoom.language);
                await refreshMyAnswers(initialRoom.id, userId);
              } else if (nextStatus === "finished") {
                await refreshMyAnswers(initialRoom.id, userId);
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${initialRoom.id}` },
            () => {
              void refreshPlayers(initialRoom.id);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") setConnectionState("connected");
            else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnectionState("disconnected");
            else setConnectionState("reconnecting");
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Player room init error:", err);
        setError(t.multiplayerLobby.errorGeneric);
        setIsLoading(false);
      }
    }

    let cleanupChannel: (() => void) | undefined;
    init().then((cleanup) => {
      cleanupChannel = cleanup;
    });

    return () => {
      cancelled = true;
      stopHeartbeat?.();
      cleanupChannel?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Safety net for a disconnected host: resolve_round_if_expired() is a
  // server-verified no-op unless the question's deadline has genuinely
  // passed, so it's safe for every player's client (not just the host's) to
  // call it once their own synced countdown reaches zero. If the host is
  // present, its own resolveRound() call normally wins the race and this
  // becomes a harmless no-op; if the host has disconnected, the round still
  // resolves the moment any connected player's timer expires, instead of
  // the room staying stuck until the host reconnects.
  useEffect(() => {
    if (!room || room.status !== "question" || !room.questionEndsAt) return;
    const msRemaining = new Date(room.questionEndsAt).getTime() - Date.now();
    const timeout = window.setTimeout(
      () => {
        void resolveRoundIfExpired(room.id).catch((err) => console.error("resolveRoundIfExpired failed:", err));
      },
      Math.max(0, msRemaining) + 500
    );
    return () => window.clearTimeout(timeout);
  }, [room]);

  async function handleToggleReady() {
    if (!room || !myPlayerId) return;
    const mine = players.find((p) => p.playerId === myPlayerId);
    try {
      await toggleReady(room.id, myPlayerId, !mine?.isReady);
    } catch (err) {
      console.error("Toggle ready failed:", err);
    }
  }

  async function handleSelectAnswer(index: number) {
    if (!room || !question || !myPlayerId) return;
    if (currentMyAnswer) return;
    const optimistic: AnswerRow = {
      id: `pending-${question.roomQuestionId}`,
      roomQuestionId: question.roomQuestionId,
      playerId: myPlayerId,
      selectedAnswer: index,
      isCorrect: false,
      responseTimeMs: 0,
      pointsAwarded: 0,
      submittedAt: new Date().toISOString(),
    };
    setMyAnswers((prev) => [...prev, optimistic]);
    try {
      const result = await submitAnswer(room.id, question.roomQuestionId, index);
      setMyAnswers((prev) =>
        prev.map((a) => (a.id === optimistic.id ? { ...a, isCorrect: result.isCorrect } : a))
      );
    } catch (err) {
      console.error("Submit answer failed:", err);
      setMyAnswers((prev) => prev.filter((a) => a.id !== optimistic.id));
      setError(t.multiplayerPlayer.errorAnswerFailed);
    }
  }

  async function handlePlayAgain() {
    if (room && myPlayerId) {
      try {
        await leaveRoom(room.id, myPlayerId, false);
      } catch (err) {
        console.error("Leave room failed:", err);
      }
    }
    router.push("/multiplayer");
  }

  async function handleLeave() {
    if (room && myPlayerId) {
      try {
        await leaveRoom(room.id, myPlayerId, false);
      } catch (err) {
        console.error("Leave room failed:", err);
      }
    }
    router.push("/");
  }

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-center text-[#c6cbd6]"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <p>{t.multiplayerLobby.loadingLobby}</p>
      </main>
    );
  }

  if (error || !room || !myPlayerId) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-[#f3efe2]"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <p role="alert" className="text-lg font-semibold">
          {error ?? t.multiplayerLobby.roomNotFoundMessage}
        </p>
        <button
          type="button"
          onClick={() => router.push("/multiplayer")}
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#c6cbd6] outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300"
        >
          {t.multiplayerLobby.backToHome}
        </button>
      </main>
    );
  }

  const myPlayer = players.find((p) => p.playerId === myPlayerId);
  const currentMyAnswer = question ? myAnswers.find((a) => a.roomQuestionId === question.roomQuestionId) ?? null : null;
  // The host's own room_players row is only there so they can be listed in
  // the lobby — they never compete, so leave them out of rank/leaderboard views.
  const competitivePlayers = players.filter((p) => p.playerId !== room.hostId);

  // Orchestration (starting the battle, advancing reveal -> leaderboard ->
  // next question) is host-driven — there is no backend scheduler in this
  // project to take over if the host's browser disconnects. The one
  // exception is the question timer itself (resolveRoundIfExpired above,
  // which any connected player's client can trigger once it genuinely
  // expires). For every other phase, surface the host's connection state
  // clearly instead of leaving the player looking at a silently frozen
  // screen with no explanation.
  const hostPlayer = players.find((p) => p.playerId === room.hostId);
  const hostDisconnected = room.status !== "finished" && hostPlayer !== undefined && !isConnected(hostPlayer.lastSeenAt);

  const phaseLabelKey = `phase${room.status.charAt(0).toUpperCase()}${room.status.slice(1)}` as
    | "phaseWaiting"
    | "phaseCountdown"
    | "phaseQuestion"
    | "phaseReveal"
    | "phaseLeaderboard"
    | "phaseFinished";
  const phaseAnnouncement = t.battleShared.phaseChangedAnnouncement.replace("{phase}", t.battleShared[phaseLabelKey]);

  let content: ReactNode = null;
  switch (room.status) {
    case "waiting":
      content = (
        <PlayerLobby
          t={t}
          roomCode={room.code}
          playerName={playerName}
          hostId={room.hostId}
          myPlayerId={myPlayerId}
          players={players}
          isReady={myPlayer?.isReady ?? false}
          onToggleReady={handleToggleReady}
        />
      );
      break;
    case "countdown":
      content = <Countdown goLabel={t.multiplayerLobby.countdownGo} onComplete={() => {}} />;
      break;
    case "question":
      content = question ? (
        <PlayerQuestion
          t={t}
          question={question}
          questionCount={room.questionCount}
          questionEndsAt={room.questionEndsAt}
          score={myPlayer?.score ?? 0}
          streak={myPlayer?.currentStreak ?? 0}
          selectedAnswer={currentMyAnswer?.selectedAnswer ?? null}
          hasSubmitted={Boolean(currentMyAnswer)}
          connectionState={connectionState}
          onSelect={handleSelectAnswer}
        />
      ) : null;
      break;
    case "reveal":
      content = question ? (
        <PlayerRoundResult t={t} question={question} myAnswer={currentMyAnswer} players={competitivePlayers} myPlayerId={myPlayerId} />
      ) : null;
      break;
    case "leaderboard":
      content = (
        <HostLeaderboard t={t} players={competitivePlayers} questionNumber={room.currentQuestion} questionCount={room.questionCount} isHost={false} />
      );
      break;
    case "finished":
      content = (
        <PlayerFinalResult
          t={t}
          players={competitivePlayers}
          myPlayerId={myPlayerId}
          myAnswers={myAnswers}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {phaseAnnouncement}
      </div>
      {hostDisconnected && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-200 backdrop-blur-sm"
        >
          {t.multiplayerPlayer.hostDisconnectedMessage}
        </div>
      )}
      <AnimatePresence mode="wait">
        <div key={room.status}>{content}</div>
      </AnimatePresence>
    </>
  );
}
