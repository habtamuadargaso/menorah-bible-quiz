"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  advancePhase,
  advancePhaseIfExpired,
  ensureAnonymousSession,
  endRoom,
  fetchAnswerCount,
  fetchFinalStats,
  fetchRevealAnswers,
  fetchRoomByCode,
  fetchRoomPlayers,
  fetchRoomQuestion,
  isConnected,
  removePlayer,
  resolveRound,
  resolveRoundIfExpired,
  seedRoomQuestions,
  startBattle,
  startHeartbeat,
  type AnswerRow,
  type FinalStats,
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

const ANSWER_COUNT_POLL_MS = 1500;

const EMPTY_FINAL_STATS: FinalStats = { totalAnswers: 0, correctAnswers: 0, fastestCorrectResponseMs: null };

export default function HostRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const code = (params.code ?? "").toUpperCase();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<RoomPlayerState[]>([]);
  const [question, setQuestion] = useState<RoomQuestionView | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [revealAnswers, setRevealAnswers] = useState<AnswerRow[]>([]);
  const [finalStats, setFinalStats] = useState<FinalStats>(EMPTY_FINAL_STATS);
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

  // "N of M answered" is polled via the get_answer_count() RPC rather than
  // a realtime subscription on `answers` — see the migration's section 2/9:
  // that table only lets a client SELECT its own row now, so a live
  // per-player answer feed isn't something the host can (or should) see.
  // Guarded against staleness the same way refreshQuestion is below: a slow
  // response for a question the host has already moved past must not
  // overwrite the fresh count for the question now on screen.
  const answerCountRoomQuestionRef = useRef<string | null>(null);
  const refreshAnswerCount = useCallback(async (roomQuestionId: string) => {
    answerCountRoomQuestionRef.current = roomQuestionId;
    try {
      const count = await fetchAnswerCount(roomQuestionId);
      if (answerCountRoomQuestionRef.current !== roomQuestionId) return; // superseded
      setAnsweredCount(count);
    } catch (err) {
      console.error("Failed to load answer count:", err);
    }
  }, []);

  // Same out-of-order-response hazard as the player page's refreshQuestion
  // (see there for the full explanation) — a slow response for a question
  // the room has already left must never overwrite the current one.
  //
  // Also fixes a real early-resolve bug: `question` and `answeredCount` are
  // two separate pieces of state. Without resetting answeredCount here, the
  // moment a NEW question is set there is a render where `question` is
  // already the new one but `answeredCount` still holds the PREVIOUS
  // question's tally (fetched by refreshAnswerCount) — long enough for the
  // "auto-resolve once everyone has answered" effect below to compare a
  // stale non-zero count against the new question and end it before anyone
  // has had a chance to answer. Resetting it to 0 in the same tick as
  // setQuestion closes that window.
  const questionRequestRef = useRef(0);
  const refreshQuestion = useCallback(async (roomId: string, lang: RoomState["language"]) => {
    const requestId = ++questionRequestRef.current;
    try {
      const q = await fetchRoomQuestion(roomId, lang);
      if (questionRequestRef.current !== requestId) return null; // superseded by a newer request
      setQuestion(q);
      setAnsweredCount(0);
      if (q) await refreshAnswerCount(q.roomQuestionId);
      return q;
    } catch (err) {
      console.error("Failed to load question:", err);
      return null;
    }
  }, [refreshAnswerCount]);

  const refreshRevealAnswers = useCallback(async (roomQuestionId: string) => {
    try {
      setRevealAnswers(await fetchRevealAnswers(roomQuestionId));
    } catch (err) {
      console.error("Failed to load reveal answers:", err);
    }
  }, []);

  const refreshFinalStats = useCallback(async (roomId: string) => {
    try {
      setFinalStats(await fetchFinalStats(roomId));
    } catch (err) {
      console.error("Failed to load final stats:", err);
    }
  }, []);

  // Initial load + realtime subscriptions (rooms/room_players only — see
  // note above on `answers`).
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
        if (initialRoom.status === "question") {
          await refreshQuestion(initialRoom.id, initialRoom.language);
        } else if (initialRoom.status === "reveal") {
          const q = await refreshQuestion(initialRoom.id, initialRoom.language);
          if (q) await refreshRevealAnswers(q.roomQuestionId);
        }
        if (initialRoom.status === "finished") {
          await refreshFinalStats(initialRoom.id);
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
                      phaseEndsAt: row.phase_ends_at as string | null,
                    }
                  : prev
              );
              if (nextStatus === "question") {
                resolvedForQuestionRef.current = null;
                await refreshQuestion(initialRoom.id, initialRoom.language);
              } else if (nextStatus === "reveal") {
                const q = await refreshQuestion(initialRoom.id, initialRoom.language);
                if (q) await refreshRevealAnswers(q.roomQuestionId);
              } else if (nextStatus === "finished") {
                await refreshFinalStats(initialRoom.id);
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

  // Poll the answered count while a question is live — replaces the old
  // realtime subscription on `answers` (see refreshAnswerCount above).
  useEffect(() => {
    if (!room || room.status !== "question" || !question) return;
    const id = window.setInterval(() => void refreshAnswerCount(question.roomQuestionId), ANSWER_COUNT_POLL_MS);
    return () => window.clearInterval(id);
  }, [room, question, refreshAnswerCount]);

  // Auto-resolve the round: once every connected player has answered, the
  // host explicitly ends it early (resolveRound, host-only). Once the
  // deadline itself passes, resolveRoundIfExpired is used instead — the
  // same call any player's own client makes as a host-disconnect safety
  // net (see the player page), so the host's tab isn't a special case
  // required for the round to ever end. Both are safe no-ops once the
  // room has already left "question".
  //
  // `room.status`/`room.currentQuestion` update synchronously from the
  // realtime payload the instant a new question starts, but `question` and
  // `answeredCount` only catch up once the async refreshQuestion() call
  // resolves. That gap is a real, observable render: room.status is
  // already "question" (new) while `question`/`answeredCount` still hold
  // the PREVIOUS question's values (still true, still "everyone
  // answered"). Without this check this effect would call resolveRound()
  // on the brand-new question before anyone had a chance to answer it —
  // this is what was silently resolving questions early. question's own
  // question_number is only ever fresh once it actually reflects
  // room.currentQuestion, so gate on that before trusting anything else
  // derived from `question`.
  useEffect(() => {
    if (!room || room.status !== "question" || !room.questionEndsAt || !question) return;
    if (question.questionNumber !== room.currentQuestion) return; // question/answeredCount haven't caught up yet
    if (resolvedForQuestionRef.current === question.roomQuestionId) return;

    const answeringPlayers = players.filter((p) => p.playerId !== room.hostId && isConnected(p.lastSeenAt));
    const allAnswered = answeringPlayers.length > 0 && answeredCount >= answeringPlayers.length;
    const msRemaining = new Date(room.questionEndsAt).getTime() - Date.now();

    if (allAnswered) {
      resolvedForQuestionRef.current = question.roomQuestionId;
      void resolveRound(room.id).catch((err) => console.error("resolveRound failed:", err));
      return;
    }
    if (msRemaining <= 0) {
      resolvedForQuestionRef.current = question.roomQuestionId;
      void resolveRoundIfExpired(room.id).catch((err) => console.error("resolveRoundIfExpired failed:", err));
      return;
    }

    const timeout = window.setTimeout(() => {
      resolvedForQuestionRef.current = question.roomQuestionId;
      void resolveRoundIfExpired(room.id).catch((err) => console.error("resolveRoundIfExpired failed:", err));
    }, msRemaining + 250);
    return () => window.clearTimeout(timeout);
  }, [room, question, answeredCount, players]);

  // Backstop for a disconnected host during countdown/reveal/leaderboard:
  // these phases normally only advance via this same host's own Continue
  // clicks, but if this tab is gone, every OTHER connected room member runs
  // this identical effect (see the player page) and one of them will call
  // advancePhaseIfExpired once its own copy of phaseEndsAt passes — a
  // server-verified no-op before the deadline, so it never cuts a phase
  // short while a host is actively present and clicking through normally.
  useEffect(() => {
    if (!room) return;
    if (room.status !== "countdown" && room.status !== "reveal" && room.status !== "leaderboard") return;
    if (!room.phaseEndsAt) return;
    const msRemaining = new Date(room.phaseEndsAt).getTime() - Date.now();
    const timeout = window.setTimeout(() => {
      void advancePhaseIfExpired(room.id).catch((err) => console.error("advancePhaseIfExpired failed:", err));
    }, Math.max(0, msRemaining) + 500);
    return () => window.clearTimeout(timeout);
  }, [room]);

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
      setFinalStats(EMPTY_FINAL_STATS);
      setRevealAnswers([]);
      setAnsweredCount(0);
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
    typeof window !== "undefined" ? `${window.location.origin}/multiplayer/join?room=${room.code}` : `/multiplayer/join?room=${room.code}`;
  const connectedCount = players.filter((p) => p.playerId !== room.hostId && isConnected(p.lastSeenAt)).length;
  // Start Game only enables once at least 2 players have joined and every
  // one of them (host included, though the host row is always ready) is
  // marked ready.
  const canStartBattle = players.length >= 2 && players.every((p) => p.isReady);
  // The host's own room_players row exists so they can be listed/removed in
  // the lobby, but the host never competes — leaderboards and final results
  // should only ever rank the actual players.
  const competitivePlayers = players.filter((p) => p.playerId !== room.hostId);
  // See the identical guard (and its full explanation) on the player page:
  // `question` can briefly lag behind room.status/currentQuestion right
  // after a new question starts. Never render it as the current question
  // until its own question_number actually matches.
  const questionIsFresh = question !== null && question.questionNumber === room.currentQuestion;

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
          maxPlayers={room.maxPlayers}
          language={room.language}
          canStart={canStartBattle}
          isStarting={isStarting}
          connectionState={connectionState}
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
      content = question && questionIsFresh ? (
        <HostBattleScreen
          key={question.roomQuestionId}
          t={t}
          roomCode={room.code}
          question={question}
          categoryLabel={t.categories[room.categoryId]?.title ?? room.categoryId}
          levelLabel={`${t.multiplayerHost.levelLabel} ${room.gameLevel}`}
          questionEndsAt={room.questionEndsAt}
          answeredCount={answeredCount}
          totalPlayers={connectedCount}
          connectionState={connectionState}
        />
      ) : null;
      break;
    case "reveal":
      content = question && questionIsFresh ? (
        <HostRoundReveal t={t} question={question} answers={revealAnswers} players={players} onContinue={handleRevealContinue} />
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
      content = <HostFinalResults t={t} players={competitivePlayers} stats={finalStats} onNewBattle={handleNewBattle} />;
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
