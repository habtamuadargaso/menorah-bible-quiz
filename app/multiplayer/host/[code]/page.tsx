"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  ROUND_SECONDS,
  advancePhase,
  ensureAnonymousSession,
  endRoom,
  fetchAllRoomAnswers,
  fetchAnswersForQuestion,
  fetchRoomByCode,
  fetchRoomPlayers,
  fetchRoomQuestion,
  isConnected,
  removePlayer,
  resolveRound,
  seedRoomQuestions,
  startBattle,
  startHeartbeat,
  type AnswerRow,
  type RoomPlayerState,
  type RoomQuestionView,
  type RoomState,
} from "@/lib/liveBattleRoom";
import Countdown from "@/components/multiplayer/Countdown";
import HostLobby from "@/components/multiplayer/host/HostLobby";
import HostBattleScreen from "@/components/multiplayer/host/HostBattleScreen";
import HostRoundReveal from "@/components/multiplayer/host/HostRoundReveal";
import HostLeaderboard from "@/components/multiplayer/host/HostLeaderboard";
import HostFinalResults from "@/components/multiplayer/host/HostFinalResults";

export default function HostRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const code = (params.code ?? "").toUpperCase();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<RoomPlayerState[]>([]);
  const [question, setQuestion] = useState<RoomQuestionView | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [allAnswers, setAllAnswers] = useState<AnswerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [connectionState, setConnectionState] = useState<"connected" | "reconnecting" | "disconnected">("reconnecting");

  const resolvedForQuestionRef = useRef<string | null>(null);

  const refreshPlayers = useCallback(async (roomId: string) => {
    try {
      setPlayers(await fetchRoomPlayers(roomId));
    } catch (err) {
      console.error("Failed to refresh players:", err);
    }
  }, []);

  const refreshQuestion = useCallback(async (roomId: string, lang: RoomState["language"]) => {
    try {
      const q = await fetchRoomQuestion(roomId, lang);
      setQuestion(q);
      if (q) {
        try {
          setAnswers(await fetchAnswersForQuestion(q.roomQuestionId));
        } catch (err) {
          console.error("Failed to load answers:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load question:", err);
    }
  }, []);

  // Initial load + realtime subscriptions.
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
        if (initialRoom.hostId !== userId) {
          setError(t.multiplayerHost.notHostError);
          setIsLoading(false);
          return;
        }
        if (cancelled) return;
        setRoom(initialRoom);
        await refreshPlayers(initialRoom.id);
        if (initialRoom.status === "question" || initialRoom.status === "reveal") {
          await refreshQuestion(initialRoom.id, initialRoom.language);
        }
        if (initialRoom.status === "finished") {
          setAllAnswers(await fetchAllRoomAnswers(initialRoom.id));
        }
        stopHeartbeat = startHeartbeat(initialRoom.id, userId);
        setIsLoading(false);

        const supabase = createClient();
        const channel = supabase
          .channel(`host-room-${initialRoom.id}`)
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
                resolvedForQuestionRef.current = null;
                await refreshQuestion(initialRoom.id, initialRoom.language);
              } else if (nextStatus === "reveal") {
                await refreshQuestion(initialRoom.id, initialRoom.language);
              } else if (nextStatus === "finished") {
                setAllAnswers(await fetchAllRoomAnswers(initialRoom.id));
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
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${initialRoom.id}` },
            (payload) => {
              const row = payload.new as Record<string, unknown>;
              setAnswers((prev) => {
                if (prev.some((a) => a.id === row.id)) return prev;
                return [
                  ...prev,
                  {
                    id: row.id as string,
                    roomQuestionId: row.room_question_id as string,
                    playerId: row.player_id as string,
                    selectedAnswer: row.selected_answer as number,
                    isCorrect: row.is_correct as boolean,
                    responseTimeMs: row.response_time_ms as number,
                    pointsAwarded: row.points_awarded as number,
                    submittedAt: row.submitted_at as string,
                  },
                ];
              });
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
        console.error("Host room init error:", err);
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

  // Auto-resolve the round: when the timer runs out, or every connected
  // player has answered — whichever comes first. resolve_round() is a
  // safe no-op once the room has already left "question", so it's fine
  // if both triggers fire close together.
  useEffect(() => {
    if (!room || room.status !== "question" || !room.questionEndsAt || !question) return;
    if (resolvedForQuestionRef.current === question.roomQuestionId) return;

    const answeringPlayers = players.filter((p) => p.playerId !== room.hostId && isConnected(p.lastSeenAt));
    const allAnswered = answeringPlayers.length > 0 && answers.length >= answeringPlayers.length;

    const msRemaining = new Date(room.questionEndsAt).getTime() - Date.now();

    if (allAnswered || msRemaining <= 0) {
      resolvedForQuestionRef.current = question.roomQuestionId;
      void resolveRound(room.id).catch((err) => console.error("resolveRound failed:", err));
      return;
    }

    const timeout = window.setTimeout(() => {
      resolvedForQuestionRef.current = question.roomQuestionId;
      void resolveRound(room.id).catch((err) => console.error("resolveRound failed:", err));
    }, msRemaining + 250);
    return () => window.clearTimeout(timeout);
  }, [room, question, answers, players]);

  async function handleStart() {
    if (!room) return;
    setIsStarting(true);
    try {
      await seedRoomQuestions(room);
      await startBattle(room.id);
    } catch (err) {
      console.error("Start battle failed:", err);
      setError(err instanceof Error ? err.message : t.multiplayerLobby.errorGeneric);
    } finally {
      setIsStarting(false);
    }
  }

  async function handleEndRoom() {
    if (!room) return;
    if (!window.confirm(t.multiplayerHost.endRoomConfirm)) return;
    try {
      await endRoom(room.id);
    } catch (err) {
      console.error("End room failed:", err);
    }
    router.push("/multiplayer");
  }

  async function handleRemovePlayer(playerId: string) {
    if (!room) return;
    try {
      await removePlayer(room.id, playerId);
    } catch (err) {
      console.error("Remove player failed:", err);
    }
  }

  async function handleCountdownComplete() {
    if (!room) return;
    try {
      await advancePhase(room.id, "question");
    } catch (err) {
      console.error("Advance to question failed:", err);
    }
  }

  async function handleRevealContinue() {
    if (!room) return;
    try {
      await advancePhase(room.id, "leaderboard");
    } catch (err) {
      console.error("Advance to leaderboard failed:", err);
    }
  }

  async function handleLeaderboardContinue() {
    if (!room) return;
    try {
      const isFinal = room.currentQuestion >= room.questionCount;
      await advancePhase(room.id, isFinal ? "finished" : "countdown");
    } catch (err) {
      console.error("Advance from leaderboard failed:", err);
    }
  }

  async function handleNewBattle() {
    if (!room) return;
    try {
      await advancePhase(room.id, "waiting");
      setAllAnswers([]);
      setAnswers([]);
      setQuestion(null);
    } catch (err) {
      console.error("Restart battle failed:", err);
    }
  }

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-center text-[#c6cbd6]"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <p>{t.multiplayerHost.loadingHost}</p>
      </main>
    );
  }

  if (error || !room) {
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

  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/multiplayer/join?code=${room.code}` : `/multiplayer/join?code=${room.code}`;
  const connectedCount = players.filter((p) => p.playerId !== room.hostId && isConnected(p.lastSeenAt)).length;
  // The host's own room_players row exists so they can be listed/removed in
  // the lobby, but the host never competes — leaderboards and final results
  // should only ever rank the actual players.
  const competitivePlayers = players.filter((p) => p.playerId !== room.hostId);

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
        <HostLobby
          t={t}
          roomCode={room.code}
          joinUrl={joinUrl}
          hostId={room.hostId}
          players={players}
          categoryId={room.categoryId}
          level={room.gameLevel}
          questionCount={room.questionCount}
          canStart={players.length >= 2}
          isStarting={isStarting}
          onStart={handleStart}
          onEndRoom={handleEndRoom}
          onRemovePlayer={handleRemovePlayer}
        />
      );
      break;
    case "countdown":
      content = <Countdown goLabel={t.multiplayerLobby.countdownGo} onComplete={handleCountdownComplete} />;
      break;
    case "question":
      content = question ? (
        <HostBattleScreen
          t={t}
          roomCode={room.code}
          question={question}
          categoryLabel={t.categories[room.categoryId]?.title ?? room.categoryId}
          levelLabel={`${t.multiplayerHost.levelLabel} ${room.gameLevel}`}
          questionEndsAt={room.questionEndsAt}
          answeredCount={answers.length}
          totalPlayers={connectedCount}
          connectionState={connectionState}
        />
      ) : null;
      break;
    case "reveal":
      content = question ? (
        <HostRoundReveal t={t} question={question} answers={answers} players={players} onContinue={handleRevealContinue} />
      ) : null;
      break;
    case "leaderboard":
      content = (
        <HostLeaderboard
          t={t}
          players={competitivePlayers}
          questionNumber={room.currentQuestion}
          questionCount={room.questionCount}
          onContinue={handleLeaderboardContinue}
        />
      );
      break;
    case "finished":
      content = <HostFinalResults t={t} players={competitivePlayers} allAnswers={allAnswers} onNewBattle={handleNewBattle} />;
      break;
    default:
      content = null;
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {phaseAnnouncement}
      </div>
      <AnimatePresence mode="wait">
        <div key={room.status}>{content}</div>
      </AnimatePresence>
    </>
  );
}
