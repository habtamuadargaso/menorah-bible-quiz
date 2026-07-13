"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import { loadQuestionById } from "@/lib/questions/loadQuestionById";
import type { LoadedQuestion } from "@/lib/questions/loadQuestions";

const ROUND_SECONDS = 15;
const REVEAL_SECONDS = 4;

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

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Something went wrong.";
}

function pointsForRank(rank: number, isFinalQuestion: boolean): number {
  const base = rank === 0 ? 100 : rank === 1 ? 75 : rank === 2 ? 50 : 25;
  return isFinalQuestion ? base * 2 : base;
}

export default function OnlineBattlePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { setLang } = useLanguage();
  const code = useMemo(() => String(params.code ?? "").toUpperCase(), [params.code]);

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [roomQuestion, setRoomQuestion] = useState<RoomQuestion | null>(null);
  const [question, setQuestion] = useState<LoadedQuestion | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [userId, setUserId] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [message, setMessage] = useState("Loading battle...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingRound, setIsProcessingRound] = useState(false);
  const previousQuestionRef = useRef(0);

  const isHost = room?.host_id === userId;
  const myAnswer = answers.find((answer) => answer.player_id === userId) ?? null;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const languageName = LANGUAGES.find((item) => item.code === room?.language)?.nativeName ?? "English";

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
        setMessage("Battle room not found.");
        return;
      }

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
        setMessage("Battle complete!");
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
        setMessage("Waiting for the host to prepare this question...");
        return;
      }

      const activeRoomQuestion = roomQuestionData as RoomQuestion;
      setRoomQuestion(activeRoomQuestion);

      if (previousQuestionRef.current !== activeRoom.current_question) {
        previousQuestionRef.current = activeRoom.current_question;
        setSelectedAnswer(null);
        setQuestion(null);
      }

      const translatedQuestion = await loadQuestionById(
        activeRoomQuestion.question_id,
        activeRoom.language
      );
      if (!translatedQuestion) {
        setMessage("This question translation could not be loaded.");
        return;
      }
      setQuestion(translatedQuestion);

      const { data: answerRows, error: answerError } = await supabase
        .from("answers")
        .select("id, player_id, selected_answer, is_correct, response_time_ms, submitted_at, points_awarded")
        .eq("room_question_id", activeRoomQuestion.id)
        .order("submitted_at", { ascending: true });
      if (answerError) throw answerError;
      const currentAnswers = (answerRows ?? []) as AnswerRow[];
      setAnswers(currentAnswers);

      if (activeRoom.status === "revealing") {
        setMessage("Round results");
      } else {
        setMessage(currentAnswers.some((answer) => answer.player_id === user.id) ? "Answer locked. Waiting for other players..." : "Choose your answer.");
      }
    } catch (error) {
      console.error("Battle state error:", error);
      setMessage(errorMessage(error));
    }
  }, [code, router, setLang]);

  useEffect(() => {
    void loadBattleState();
    const intervalId = window.setInterval(() => void loadBattleState(), 700);
    return () => window.clearInterval(intervalId);
  }, [loadBattleState]);

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
      setMessage("Answer locked. Waiting for other players...");
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
  }, [answers, isHost, isProcessingRound, loadBattleState, players, question, room, roomQuestion]);

  useEffect(() => {
    void processRound();
  }, [processRound, timeLeft]);

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

  if (room?.status === "finished") {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">Final Results</p>
          <h1 className="mt-3 text-5xl font-black">🏆 Bible Champion</h1>
          {sortedPlayers[0] && <p className="mt-5 text-3xl font-bold text-amber-300">{sortedPlayers[0].display_name}</p>}
          <div className="mt-8 space-y-3 text-left">
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="font-bold">{index + 1}. {player.display_name}</span>
                <span className="text-xl font-black text-amber-300">{player.score}</span>
              </div>
            ))}
          </div>
          <button onClick={leaveBattle} className="mt-8 rounded-xl bg-amber-400 px-7 py-3 font-bold text-slate-950">Return to Multiplayer</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Online Bible Battle</p>
            <h1 className="mt-1 text-2xl font-bold">Room {code}</h1>
            <p className="mt-1 text-sm text-slate-400">{languageName} · Question {room?.current_question ?? 1} of 10</p>
          </div>
          <div className={`grid h-16 w-16 place-items-center rounded-full border-4 text-2xl font-black ${timeLeft <= 3 ? "border-red-400 text-red-300" : "border-amber-400 text-amber-300"}`}>{timeLeft}</div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
            {!question ? (
              <p className="py-20 text-center text-slate-300">{message}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-300">{question.reference}</p>
                <h2 className="mt-3 text-2xl font-bold leading-relaxed sm:text-3xl">{question.question}</h2>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {question.choices.map((choice, index) => {
                    const locked = Boolean(myAnswer) || room?.status !== "playing" || isSubmitting;
                    const isCorrect = room?.status === "revealing" && index === question.correctIndex;
                    const isMine = (myAnswer?.selected_answer ?? selectedAnswer) === index;
                    return (
                      <button
                        key={`${question.id}-${index}`}
                        type="button"
                        onClick={() => submitAnswer(index)}
                        disabled={locked}
                        className={`rounded-2xl border p-5 text-left font-semibold transition ${isCorrect ? "border-emerald-400 bg-emerald-400/20" : isMine ? "border-blue-400 bg-blue-400/20" : "border-white/15 bg-slate-900/70 hover:border-amber-400/60"} disabled:cursor-not-allowed`}
                      >
                        <span className="mr-3 text-amber-300">{String.fromCharCode(65 + index)}.</span>{choice}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-slate-300">{message}</div>
                {room?.status === "revealing" && (
                  <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                    <p className="font-bold text-emerald-300">Correct answer: {question.choices[question.correctIndex]}</p>
                    <p className="mt-2 text-sm text-slate-300">{question.explanation}</p>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="rounded-3xl border border-white/15 bg-white/5 p-5">
            <h3 className="text-xl font-bold">Live Scoreboard</h3>
            <div className="mt-4 space-y-3">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between rounded-xl bg-slate-900/80 p-4">
                  <span className="font-semibold">{index + 1}. {player.display_name}</span>
                  <span className="font-black text-amber-300">{player.score}</span>
                </div>
              ))}
            </div>
            <button onClick={leaveBattle} className="mt-6 w-full rounded-xl border border-red-400/40 px-4 py-3 font-semibold text-red-300 hover:bg-red-400/10">Leave Battle</button>
          </aside>
        </div>
      </div>
    </main>
  );
}
