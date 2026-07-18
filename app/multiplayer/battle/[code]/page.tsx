"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { type LangCode } from "@/lib/i18n/locales";
import { loadQuestionById } from "@/lib/questions/loadQuestionById";
import type { LoadedQuestion } from "@/lib/questions/loadQuestions";
import { difficultyForLevel } from "@/lib/levels";
import type { CategoryId } from "@/lib/categories";
import { addQuizRewards } from "@/lib/progress";
import BattleHeader from "@/components/battle/BattleHeader";
import BattleQuestion from "@/components/battle/BattleQuestion";
import BattleLeaderboard, { type BattleLeaderboardEntry } from "@/components/battle/BattleLeaderboard";
import BattlePlayerStatus, { type PlayerBattleStatus } from "@/components/battle/BattlePlayerStatus";
import BattleSummary from "@/components/battle/BattleSummary";

const ROUND_SECONDS = 15;
const REVEAL_SECONDS = 4;
// Consecutive failed room lookups required before we declare the room
// truly not-found (see notFoundStreakRef below).
const NOT_FOUND_THRESHOLD = 5;

type RoomStatus = "waiting" | "playing" | "revealing" | "finished";

type Room = {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  current_question: number;
  language: LangCode;
  category_id: string;
  game_level: number;
  question_started_at: string | null;
  question_ends_at: string | null;
};

type RoomPlayer = {
  id: string;
  player_id: string;
  display_name: string;
  score: number;
};

type RoomQuestion = {
  id: string;
  question_number: number;
  question_id: string;
};

type AnswerRow = {
  id: string;
  player_id: string;
  selected_answer: number;
  is_correct: boolean;
  response_time_ms: number;
  submitted_at: string;
  points_awarded: number;
};

function pointsForRank(rank: number, isFinalQuestion: boolean): number {
  const base = rank === 0 ? 100 : rank === 1 ? 75 : rank === 2 ? 50 : 25;
  return isFinalQuestion ? base * 2 : base;
}

export default function OnlineBattlePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { t, setLang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const tb = t.liveBattle;
  const code = useMemo(() => String(params.code ?? "").toUpperCase(), [params.code]);

  function errorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      return String(error.message);
    }
    return t.multiplayerLobby.errorGeneric;
  }

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [roomQuestion, setRoomQuestion] = useState<RoomQuestion | null>(null);
  const [question, setQuestion] = useState<LoadedQuestion | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [userId, setUserId] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [message, setMessage] = useState(tb.loadingBattle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingRound, setIsProcessingRound] = useState(false);
  const previousQuestionRef = useRef(0);
  const streakRef = useRef(0);
  const lastStreakRoundRef = useRef<number | null>(null);
  const rewardsAwardedRef = useRef(false);
  // A single missed lookup can happen for reasons that have nothing to do
  // with the room genuinely being gone (a slow first auth check, a brief
  // network hiccup, realtime firing a fetch a beat before the row is
  // visible). Only declare the room truly not-found after several
  // consecutive misses, so a valid room is never misreported.
  const notFoundStreakRef = useRef(0);
  const [confirmedNotFound, setConfirmedNotFound] = useState(false);
  const [battleRewards, setBattleRewards] = useState<{
    xpEarned: number;
    coinsEarned: number;
    accuracyPct: number;
    reactionSeconds: number;
  } | null>(null);

  const isHost = room?.host_id === userId;
  const myAnswer = answers.find((answer) => answer.player_id === userId) ?? null;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const categoryTitle = room ? t.categories[room.category_id as CategoryId]?.title ?? room.category_id : "";
  const difficultyLabel = room ? t.quiz.difficulty[difficultyForLevel(room.game_level)] : "";

  const loadBattleState = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace("/multiplayer");
        return;
      }
      setUserId(user.id);

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, code, host_id, status, current_question, language, category_id, game_level, question_started_at, question_ends_at")
        .eq("code", code)
        .maybeSingle();
      if (roomError) throw roomError;
      if (!roomData) {
        notFoundStreakRef.current += 1;
        if (notFoundStreakRef.current >= NOT_FOUND_THRESHOLD) {
          setConfirmedNotFound(true);
          setMessage(tb.roomNotFound);
        } else {
          // Still within the grace period — this looks exactly like normal
          // loading to the player, never the "not found" wording, so a
          // valid room never flashes a false error while it resolves.
          setMessage(tb.loadingBattle);
        }
        return;
      }

      notFoundStreakRef.current = 0;
      setConfirmedNotFound(false);

      const activeRoom = roomData as Room;
      setRoom(activeRoom);
      setLang(activeRoom.language);

      if (activeRoom.status === "waiting") {
        router.replace(`/multiplayer/lobby/${activeRoom.code}`);
        return;
      }

      const { data: playerRows, error: playersError } = await supabase
        .from("room_players")
        .select("id, player_id, display_name, score")
        .eq("room_id", activeRoom.id)
        .order("score", { ascending: false });
      if (playersError) throw playersError;
      setPlayers((playerRows ?? []) as RoomPlayer[]);

      if (activeRoom.status === "finished") {
        setQuestion(null);
        setRoomQuestion(null);
        setMessage(tb.battleComplete);
        return;
      }

      const { data: roomQuestionData, error: roomQuestionError } = await supabase
        .from("room_questions")
        .select("id, question_number, question_id")
        .eq("room_id", activeRoom.id)
        .eq("question_number", activeRoom.current_question)
        .maybeSingle();
      if (roomQuestionError) throw roomQuestionError;
      if (!roomQuestionData) {
        setMessage(tb.waitingForQuestion);
        return;
      }

      const activeRoomQuestion = roomQuestionData as RoomQuestion;
      setRoomQuestion(activeRoomQuestion);

      if (previousQuestionRef.current !== activeRoom.current_question) {
        previousQuestionRef.current = activeRoom.current_question;
        setSelectedAnswer(null);
        setQuestion(null);
      }

      const translatedQuestion = await loadQuestionById(activeRoomQuestion.question_id, activeRoom.language);
      if (!translatedQuestion) {
        setMessage(tb.translationUnavailable);
        return;
      }
      setQuestion(translatedQuestion);

      const { data: answerRows, error: answerError } = await supabase
        .from("answers")
        .select("id, player_id, selected_answer, is_correct, response_time_ms, submitted_at, points_awarded")
        .eq("room_question_id", activeRoomQuestion.id)
        .order("submitted_at", { ascending: true });
      if (answerError) throw answerError;
      setAnswers((answerRows ?? []) as AnswerRow[]);
      setMessage("");
    } catch (error) {
      console.error("Battle state error:", error);
      setMessage(errorMessage(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, router, setLang, tb.roomNotFound, tb.battleComplete, tb.waitingForQuestion, tb.translationUnavailable]);

  useEffect(() => {
    void loadBattleState();
    // Poll quickly until the room is first found (so a genuinely bad code
    // reaches the confirmed-not-found threshold within a few seconds, not
    // tens of seconds). Once the room has loaded, realtime (below) carries
    // the fast path and this becomes a slower resilience fallback for the
    // rare case a realtime event is missed (e.g. a tab resuming from
    // background) — it's also what restores state after a refresh.
    const intervalMs = room?.id ? 4000 : 700;
    const intervalId = window.setInterval(() => void loadBattleState(), intervalMs);
    return () => window.clearInterval(intervalId);
  }, [loadBattleState, room?.id]);

  // Realtime: the room itself (status flips, current_question advances,
  // the synchronized question_ends_at timestamp). Filtered by room code
  // since we don't have the room's id until the first successful load.
  useEffect(() => {
    if (!code) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`battle-room-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        () => void loadBattleState()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code, loadBattleState]);

  // Realtime: players joining/leaving/scoring, and every answer submitted
  // by anyone in the room — this is what makes the player list, live
  // status strip, and leaderboard update instantly instead of waiting for
  // the next poll tick.
  useEffect(() => {
    if (!room?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`battle-room-players-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` },
        () => void loadBattleState()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers", filter: `room_id=eq.${room.id}` },
        () => void loadBattleState()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id, loadBattleState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!room?.question_ends_at || room.status !== "playing") {
        setTimeLeft(room?.status === "revealing" ? 0 : ROUND_SECONDS);
        return;
      }
      setTimeLeft(Math.max(0, Math.ceil((new Date(room.question_ends_at).getTime() - Date.now()) / 1000)));
    }, 200);
    return () => window.clearInterval(intervalId);
  }, [room?.question_ends_at, room?.status]);

  // Track a per-player correct-round streak, incremented/reset exactly once
  // per round as it enters "revealing" — purely a display concern, does not
  // touch scoring.
  useEffect(() => {
    if (room?.status !== "revealing") return;
    if (lastStreakRoundRef.current === room.current_question) return;
    const mine = answers.find((answer) => answer.player_id === userId);
    if (!mine) return;
    lastStreakRoundRef.current = room.current_question;
    streakRef.current = mine.is_correct ? streakRef.current + 1 : 0;
  }, [room?.status, room?.current_question, answers, userId]);

  async function submitAnswer(choiceIndex: number) {
    if (!room || !roomQuestion || !question || !userId || myAnswer || room.status !== "playing") return;
    setIsSubmitting(true);
    setSelectedAnswer(choiceIndex);
    try {
      const supabase = createClient();
      const startedAt = room.question_started_at ? new Date(room.question_started_at).getTime() : Date.now();
      const responseTime = Math.max(0, Date.now() - startedAt);
      const { error } = await supabase.from("answers").insert({
        room_id: room.id,
        room_question_id: roomQuestion.id,
        player_id: userId,
        selected_answer: choiceIndex,
        is_correct: choiceIndex === question.correctIndex,
        response_time_ms: responseTime,
        points_awarded: 0,
      });
      if (error && error.code !== "23505") throw error;
      await loadBattleState();
    } catch (error) {
      setMessage(errorMessage(error));
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const processRound = useCallback(async () => {
    if (!room || !roomQuestion || !question || !isHost || room.status !== "playing" || isProcessingRound) return;
    const expired = !room.question_ends_at || Date.now() >= new Date(room.question_ends_at).getTime();
    const everyoneAnswered = players.length > 0 && answers.length >= players.length;
    if (!expired && !everyoneAnswered) return;

    setIsProcessingRound(true);
    const supabase = createClient();
    try {
      const { data: claimed, error: claimError } = await supabase
        .from("rooms")
        .update({ status: "revealing" })
        .eq("id", room.id)
        .eq("status", "playing")
        .select("id")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return;

      const correctAnswers = answers
        .filter((answer) => answer.is_correct)
        .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

      for (let index = 0; index < correctAnswers.length; index += 1) {
        const answer = correctAnswers[index];
        const points = pointsForRank(index, room.current_question === 10);
        await supabase.from("answers").update({ points_awarded: points }).eq("id", answer.id);
        const currentPlayer = players.find((player) => player.player_id === answer.player_id);
        if (currentPlayer) {
          await supabase.from("room_players").update({ score: currentPlayer.score + points }).eq("id", currentPlayer.id);
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, REVEAL_SECONDS * 1000));

      if (room.current_question >= 10) {
        await supabase.from("rooms").update({ status: "finished", question_started_at: null, question_ends_at: null }).eq("id", room.id);
      } else {
        const next = room.current_question + 1;
        const now = Date.now();
        await supabase.from("rooms").update({
          status: "playing",
          current_question: next,
          question_started_at: new Date(now).toISOString(),
          question_ends_at: new Date(now + ROUND_SECONDS * 1000).toISOString(),
        }).eq("id", room.id);
      }
      await loadBattleState();
    } catch (error) {
      console.error("Round processing error:", error);
      setMessage(errorMessage(error));
    } finally {
      setIsProcessingRound(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, isHost, isProcessingRound, loadBattleState, players, question, room, roomQuestion]);

  useEffect(() => {
    void processRound();
  }, [processRound, timeLeft]);

  // Once the battle finishes, compute this player's own real results (from
  // their actual answers.is_correct / response_time_ms rows across the
  // whole room) and grant real XP/coins via the SAME addQuizRewards()
  // function — and the SAME formula constants — solo quiz already uses.
  // Nothing here changes that formula or how the Profile screen reads it.
  useEffect(() => {
    if (room?.status !== "finished" || !userId || rewardsAwardedRef.current) return;
    rewardsAwardedRef.current = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("answers")
          .select("is_correct, response_time_ms")
          .eq("player_id", userId)
          .eq("room_id", room.id);
        if (error) throw error;
        const rows = (data ?? []) as Array<{ is_correct: boolean; response_time_ms: number }>;
        const total = rows.length;
        const correctCount = rows.filter((r) => r.is_correct).length;
        const fastAnswers = rows.filter((r) => r.response_time_ms < 5000).length;
        const perfect = total > 0 && correctCount === total;
        const xpEarned = correctCount * 20 + fastAnswers * 10 + 100 + (perfect ? 50 : 0);
        const coinsEarned = correctCount * 5 + (perfect ? 25 : 0);
        const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        const avgResponseMs = total > 0 ? rows.reduce((sum, r) => sum + r.response_time_ms, 0) / total : 0;
        addQuizRewards(xpEarned, coinsEarned);
        setBattleRewards({ xpEarned, coinsEarned, accuracyPct, reactionSeconds: avgResponseMs / 1000 });
      } catch (error) {
        console.error("Battle reward computation error:", error);
      }
    })();
  }, [room?.status, room?.id, userId]);

  async function leaveBattle() {
    if (!room || !userId) {
      router.replace("/multiplayer");
      return;
    }
    const supabase = createClient();
    if (isHost) {
      await supabase.from("rooms").delete().eq("id", room.id);
    } else {
      await supabase.from("room_players").delete().eq("room_id", room.id).eq("player_id", userId);
    }
    router.replace("/multiplayer");
  }

  const leaderboardEntries: BattleLeaderboardEntry[] = sortedPlayers.map((player) => ({
    id: player.id,
    name: player.display_name,
    score: player.score,
    isYou: player.player_id === userId,
  }));

  function statusForPlayer(player: RoomPlayer): PlayerBattleStatus {
    const answer = answers.find((a) => a.player_id === player.player_id);
    if (room?.status === "revealing") {
      // NOTE: "disconnected" has no real detection today (polling only, no
      // presence/heartbeat column) — the status type/UI supports it, but a
      // missing answer at reveal time is treated as incorrect, not
      // disconnected, since that's the honest inference available.
      if (!answer) return "incorrect";
      return answer.is_correct ? "correct" : "incorrect";
    }
    return answer ? "answered" : "waiting";
  }

  const revealing = room?.status === "revealing";
  const mineThisRound = answers.find((answer) => answer.player_id === userId);
  const roundResult =
    revealing && mineThisRound
      ? { correct: mineThisRound.is_correct, pointsAwarded: mineThisRound.points_awarded, streak: streakRef.current }
      : null;

  if (confirmedNotFound) {
    return (
      <main
        className="flex min-h-screen w-full items-center justify-center px-4 py-8 text-center text-[#f3efe2] sm:px-8"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <div className="rounded-card border border-white/10 bg-white/[0.04] p-8 shadow-premium">
          <p className="text-lg font-semibold">{tb.roomNotFound}</p>
          <motion.button
            type="button"
            onClick={() => router.push("/multiplayer")}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="mt-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-6 py-3 text-sm font-bold text-navy-900 shadow-gold outline-none transition-shadow hover:shadow-[0_0_36px_rgba(232,193,95,0.5)] focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          >
            {tb.returnToMultiplayer}
          </motion.button>
        </div>
      </main>
    );
  }

  if (room?.status === "finished") {
    return (
      <main
        className="min-h-screen w-full px-4 py-8 text-[#f3efe2] sm:px-8"
        style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
      >
        <BattleSummary
          entries={leaderboardEntries}
          championLabel={t.battle.champion}
          topThreeHeading={tb.topThreeHeading}
          playersHeading={t.battle.players}
          xpEarned={battleRewards?.xpEarned ?? 0}
          coinsEarned={battleRewards?.coinsEarned ?? 0}
          accuracyPct={battleRewards?.accuracyPct ?? 0}
          reactionSeconds={battleRewards?.reactionSeconds ?? 0}
          xpLabel={t.result.stats.xpEarned}
          coinsLabel={t.result.stats.coinsEarned}
          accuracyLabel={t.result.accuracy}
          reactionLabel={tb.reactionTimeLabel}
          secondsShort={tb.secondsShort}
          leaveLabel={tb.returnToMultiplayer}
          onLeave={leaveBattle}
        />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen w-full px-4 py-8 text-[#f3efe2] sm:px-8"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <div className="mx-auto max-w-5xl">
        <BattleHeader
          roomCode={code}
          roomLabel={tb.roomLabel}
          questionProgressText={tb.questionProgress.replace("{current}", String(room?.current_question ?? 1)).replace("{total}", "10")}
          remainingPlayersLabel={tb.remainingPlayers}
          remainingPlayersCount={players.length}
          categoryTitle={categoryTitle}
          difficultyLabel={difficultyLabel}
          timeLeft={timeLeft}
          totalSeconds={ROUND_SECONDS}
        />

        {players.length > 0 && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.3, delay: 0.1 }}
            className="mt-4 flex flex-wrap justify-center gap-2"
          >
            {players.map((player) => {
              const status = statusForPlayer(player);
              const statusLabel = {
                waiting: tb.statusWaiting,
                answered: tb.statusAnswered,
                correct: tb.statusCorrect,
                incorrect: tb.statusIncorrect,
                disconnected: tb.statusDisconnected,
              }[status];
              return (
                <BattlePlayerStatus
                  key={player.id}
                  name={player.display_name}
                  status={status}
                  label={statusLabel}
                  isYou={player.player_id === userId}
                />
              );
            })}
          </motion.div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section>
            {!question ? (
              <div className="rounded-card border border-white/10 bg-white/[0.04] p-6 py-20 text-center text-[#a7aebd] shadow-premium">
                {message}
              </div>
            ) : (
              <BattleQuestion
                reference={question.reference}
                questionText={question.question}
                choices={question.choices}
                correctIndex={question.correctIndex}
                explanation={question.explanation}
                selected={myAnswer?.selected_answer ?? selectedAnswer}
                revealing={Boolean(revealing)}
                onSelect={submitAnswer}
                chooseAnswerLabel={tb.chooseAnswer}
                answerLockedLabel={tb.answerLockedWaiting}
                correctAnswerLabel={tb.correctAnswerLabel}
                roundResultsLabel={tb.roundResults}
                roundResult={roundResult}
                streakLabel={tb.streakLabel}
                pointsShort={t.battle.pointsShort}
              />
            )}
          </section>

          <aside className="rounded-card border border-white/15 bg-white/[0.04] p-5 shadow-premium">
            <BattleLeaderboard heading={t.battle.players} entries={leaderboardEntries} />
            <motion.button
              type="button"
              onClick={leaveBattle}
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="mt-6 w-full rounded-full border border-red-400/40 px-4 py-3 text-sm font-semibold text-red-300 outline-none transition-colors hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              {t.battle.exit}
            </motion.button>
          </aside>
        </div>
      </div>
    </main>
  );
}
