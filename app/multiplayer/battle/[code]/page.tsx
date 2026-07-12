"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { questionById } from "@/lib/questions";
import type { LangCode } from "@/lib/i18n/locales";

const ROUND_SECONDS = 15;

type Room = {
  id: string;
  code: string;
  host_id: string;
  status: "waiting" | "playing" | "revealing" | "finished";
  current_question: number;
  language: string;
  question_started_at: string | null;
  question_ends_at: string | null;
};

type Player = { id: string; player_id: string; display_name: string; score: number };
type RoomQuestion = { id: string; question_number: number; question_id: string };
type Answer = {
  id: string;
  player_id: string;
  selected_answer: number;
  is_correct: boolean;
  response_time_ms: number;
  points_awarded: number;
  submitted_at: string;
};

export default function LiveBattlePage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const router = useRouter();
  const code = rawCode.toUpperCase();
  const supabase = useMemo(() => createClient(), []);

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomQuestion, setRoomQuestion] = useState<RoomQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [message, setMessage] = useState("Connecting to live battle...");
  const advancingRef = useRef(false);

  const lang: LangCode = room?.language === "am" ? "am" : "en";
  const question = roomQuestion ? questionById(lang, roomQuestion.question_id) : null;
  const isHost = room?.host_id === userId;
  const myAnswer = answers.find((answer) => answer.player_id === userId);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/multiplayer");
      return;
    }
    setUserId(auth.user.id);

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id,code,host_id,status,current_question,language,question_started_at,question_ends_at")
      .eq("code", code)
      .maybeSingle();
    if (roomError || !roomData) {
      setMessage(roomError?.message ?? "Room not found.");
      return;
    }
    setRoom(roomData as Room);

    const { data: playerData } = await supabase
      .from("room_players")
      .select("id,player_id,display_name,score")
      .eq("room_id", roomData.id)
      .order("score", { ascending: false });
    setPlayers((playerData ?? []) as Player[]);

    if (roomData.status === "finished") {
      setMessage("Battle complete!");
      return;
    }

    const { data: questionData } = await supabase
      .from("room_questions")
      .select("id,question_number,question_id")
      .eq("room_id", roomData.id)
      .eq("question_number", roomData.current_question)
      .maybeSingle();
    setRoomQuestion((questionData ?? null) as RoomQuestion | null);

    if (questionData) {
      const { data: answerData } = await supabase
        .from("answers")
        .select("id,player_id,selected_answer,is_correct,response_time_ms,points_awarded,submitted_at")
        .eq("room_question_id", questionData.id)
        .order("submitted_at", { ascending: true });
      setAnswers((answerData ?? []) as Answer[]);
    }
    setMessage(roomData.status === "revealing" ? "Round results" : "Choose your answer");
  }, [code, router, supabase]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`battle:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, () => void load())
      .subscribe();
    const fallback = window.setInterval(() => void load(), 2500);
    return () => {
      window.clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [code, load, supabase]);

  useEffect(() => {
    setSelected(null);
  }, [room?.current_question]);

  useEffect(() => {
    if (!room?.question_ends_at || room.status !== "playing") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(room.question_ends_at!).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [room?.question_ends_at, room?.status]);

  async function submitAnswer(index: number) {
    if (!room || !roomQuestion || !question || myAnswer || room.status !== "playing") return;
    setSelected(index);
    const started = room.question_started_at ? new Date(room.question_started_at).getTime() : Date.now();
    const responseTime = Math.max(0, Date.now() - started);
    const { error } = await supabase.from("answers").insert({
      room_id: room.id,
      room_question_id: roomQuestion.id,
      player_id: userId,
      selected_answer: index,
      is_correct: index === question.correctIndex,
      response_time_ms: responseTime,
    });
    if (error) setMessage(error.message);
  }

  const revealRound = useCallback(async () => {
    if (!isHost || !room || !roomQuestion || !question || advancingRef.current) return;
    advancingRef.current = true;
    try {
      const { data: rawAnswers } = await supabase
        .from("answers")
        .select("id,player_id,is_correct,response_time_ms")
        .eq("room_question_id", roomQuestion.id)
        .order("response_time_ms", { ascending: true });
      const correct = (rawAnswers ?? []).filter((answer) => answer.is_correct);
      const base = [100, 75, 50];
      for (let i = 0; i < (rawAnswers ?? []).length; i += 1) {
        const answer = rawAnswers![i];
        const rank = correct.findIndex((item) => item.id === answer.id);
        const multiplier = room.current_question === 10 ? 2 : 1;
        const points = answer.is_correct ? (base[rank] ?? 25) * multiplier : 0;
        await supabase.from("answers").update({ points_awarded: points }).eq("id", answer.id);
        if (points > 0) {
          const player = players.find((item) => item.player_id === answer.player_id);
          await supabase.from("room_players").update({ score: (player?.score ?? 0) + points }).eq("room_id", room.id).eq("player_id", answer.player_id);
        }
      }
      await supabase.from("rooms").update({ status: "revealing" }).eq("id", room.id);
    } finally {
      advancingRef.current = false;
    }
  }, [isHost, players, question, room, roomQuestion, supabase]);

  useEffect(() => {
    if (!isHost || !room || room.status !== "playing") return;
    if (timeLeft === 0 || (players.length > 0 && answers.length >= players.length)) void revealRound();
  }, [answers.length, isHost, players.length, revealRound, room, timeLeft]);

  async function nextRound() {
    if (!isHost || !room) return;
    if (room.current_question >= 10) {
      await supabase.from("rooms").update({ status: "finished" }).eq("id", room.id);
      return;
    }
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + ROUND_SECONDS * 1000);
    await supabase.from("rooms").update({
      status: "playing",
      current_question: room.current_question + 1,
      question_started_at: startedAt.toISOString(),
      question_ends_at: endsAt.toISOString(),
    }).eq("id", room.id);
  }

  if (!room) return <Shell><p className="text-center text-slate-300">{message}</p></Shell>;

  if (room.status === "finished") {
    const ranked = [...players].sort((a, b) => b.score - a.score);
    return (
      <Shell>
        <div className="text-center">
          <div className="text-6xl">🏆</div>
          <p className="mt-4 text-sm uppercase tracking-[0.35em] text-amber-400">Bible Champion</p>
          <h1 className="mt-2 text-4xl font-black">{ranked[0]?.display_name ?? "Champion"}</h1>
        </div>
        <div className="mt-8 space-y-3">
          {ranked.map((player, index) => <ScoreRow key={player.id} player={player} rank={index + 1} />)}
        </div>
        <button onClick={() => router.push("/multiplayer")} className="mt-8 w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950">Return to Multiplayer</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-amber-300">Room {code}</span>
        <span>Question {room.current_question}/10</span>
        <span className={timeLeft <= 3 ? "font-black text-red-400" : "font-black text-amber-300"}>{timeLeft}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-amber-400" animate={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }} /></div>

      <AnimatePresence mode="wait">
        <motion.section key={roomQuestion?.id ?? room.current_question} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">{message}</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-center text-2xl font-bold leading-snug sm:text-3xl">{question?.question ?? "Question is loading..."}</h1>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {(question?.choices ?? []).map((choice, index) => {
              const locked = Boolean(myAnswer) || room.status !== "playing";
              const reveal = room.status === "revealing";
              const correct = reveal && index === question?.correctIndex;
              const wrong = reveal && (myAnswer?.selected_answer ?? selected) === index && !correct;
              return <button key={index} disabled={locked} onClick={() => void submitAnswer(index)} className={`rounded-2xl border px-5 py-4 text-left font-semibold transition ${correct ? "border-emerald-400 bg-emerald-400/20" : wrong ? "border-red-400 bg-red-400/15" : "border-white/15 bg-slate-900/70 hover:border-amber-400"}`}>{choice}</button>;
            })}
          </div>
          {myAnswer && room.status === "playing" && <p className="mt-5 text-center font-semibold text-emerald-300">Answer locked. Waiting for the other players…</p>}
          {room.status === "revealing" && question && (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
              <p className="font-bold text-amber-300">{question.reference}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{question.explanation}</p>
              {isHost && <button onClick={() => void nextRound()} className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950">{room.current_question === 10 ? "Finish Battle" : "Next Question"}</button>}
              {!isHost && <p className="mt-4 text-center text-sm text-slate-300">Waiting for the host…</p>}
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">Live Scoreboard</h2>
        <div className="mt-3 space-y-2">{[...players].sort((a,b)=>b.score-a.score).map((player,index)=><ScoreRow key={player.id} player={player} rank={index+1}/>)}</div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white"><div className="mx-auto max-w-3xl">{children}</div></main>;
}

function ScoreRow({ player, rank }: { player: Player; rank: number }) {
  return <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-4 py-3"><span><b className="mr-3 text-amber-300">#{rank}</b>{player.display_name}</span><b>{player.score}</b></div>;
}
