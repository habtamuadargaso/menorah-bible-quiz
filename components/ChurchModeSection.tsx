"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  ChevronRight,
  Church,
  Clock3,
  Crown,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { LANGUAGES, type LangCode } from "@/lib/i18n/locales";
import {
  pickFriendsBattleQuestions,
} from "@/lib/friendsBattle/localQuestions";
import type { Difficulty } from "@/lib/questions/types";
import {
  advanceChurchQuestion,
  getChurchAccuracy,
  rankChurchPlayers,
  recordChurchAnswer,
  replayChurchMatch,
  resetChurchMatch,
  resolveChurchTimeout,
  startChurchMatch,
  type ChurchAnswerResult,
  type ChurchPlayer,
} from "@/lib/churchMode/engine";
import type { Question } from "@/lib/questions";

type Phase = "welcome" | "settings" | "lobby" | "question" | "reveal" | "results";

interface SessionSettings {
  churchName: string;
  quizName: string;
  difficulty: Difficulty;
  language: LangCode;
  questionCount: number;
  secondsPerQuestion: number;
}

const DEFAULT_SETTINGS: SessionSettings = {
  churchName: "",
  quizName: "Bible Quiz",
  difficulty: "Medium",
  language: "en",
  questionCount: 10,
  secondsPerQuestion: 20,
};

const panelClass =
  "rounded-[28px] border border-[#D4AF37]/25 bg-[linear-gradient(145deg,rgba(10,30,61,.98),rgba(7,20,42,.98))] shadow-[0_24px_80px_rgba(0,0,0,.28)]";
const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 text-base text-white outline-none transition focus:border-[#FFD97A] focus:ring-2 focus:ring-[#FFD97A]/20";
const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#FFD97A,#D4AF37)] px-6 font-bold text-[#07152D] shadow-[0_10px_28px_rgba(212,175,55,.2)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD97A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07152D] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 font-semibold text-white transition hover:border-[#D4AF37]/50 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD97A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07152D] active:scale-[.98]";

export default function ChurchModeSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const nextPlayerId = useRef(1);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<ChurchPlayer[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ChurchAnswerResult>>({});
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.secondsPerQuestion);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const quitButtonRef = useRef<HTMLButtonElement>(null);
  const quitDialogRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[questionIndex];
  const rankedPlayers = useMemo(() => rankChurchPlayers(players), [players]);
  const sessionLanguage = LANGUAGES.find(({ code }) => code === settings.language)?.nativeName ?? settings.language;

  useEffect(() => {
    if (phase !== "question" || quitOpen || timeLeft <= 0) return;
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, quitOpen, timeLeft]);

  useEffect(() => {
    if (phase !== "question" || timeLeft !== 0 || !currentQuestion) return;

    const timedOut = resolveChurchTimeout({ phase, players, questions, questionIndex, currentPlayerIndex, answers, timeLeft, secondsPerQuestion: settings.secondsPerQuestion });
    applyMatchState(timedOut);
  }, [answers, currentPlayerIndex, currentQuestion, phase, players, questionIndex, questions, settings.secondsPerQuestion, timeLeft]);

  useEffect(() => {
    if (!quitOpen) return;
    quitDialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setQuitOpen(false);
      window.requestAnimationFrame(() => quitButtonRef.current?.focus());
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [quitOpen]);

  const applyMatchState = (state: ReturnType<typeof resetChurchMatch>) => {
    setPhase(state.phase);
    setPlayers(state.players);
    setQuestions(state.questions);
    setQuestionIndex(state.questionIndex);
    setCurrentPlayerIndex(state.currentPlayerIndex);
    setAnswers(state.answers);
    setTimeLeft(state.timeLeft);
  };

  const currentMatchState = () => ({
    phase: phase === "welcome" || phase === "settings" ? "lobby" as const : phase,
    players,
    questions,
    questionIndex,
    currentPlayerIndex,
    answers,
    timeLeft,
    secondsPerQuestion: settings.secondsPerQuestion,
  });

  const goToPhase = (nextPhase: Phase) => {
    setPhase(nextPhase);
    window.requestAnimationFrame(() =>
      sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }),
    );
  };

  const resetSession = () => {
    setSettings(DEFAULT_SETTINGS);
    setParticipantName("");
    applyMatchState(resetChurchMatch(DEFAULT_SETTINGS.secondsPerQuestion));
    setQuitOpen(false);
    setError(null);
    goToPhase("welcome");
  };

  const createSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const selection = await pickFriendsBattleQuestions(
      settings.language,
      1,
      settings.difficulty,
    );
    setIsLoading(false);
    if (!selection) {
      setError("Not enough questions are available for that language and difficulty.");
      return;
    }
    setQuestions(selection.questions.slice(0, settings.questionCount));
    goToPhase("lobby");
  };

  const addParticipant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = participantName.trim();
    if (!name || players.length >= 8) return;
    if (players.some((player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("Each participant needs a unique name.");
      return;
    }
    setPlayers((current) => [
      ...current,
      {
        id: `church-player-${nextPlayerId.current++}`,
        name,
        // Church Mode is host-controlled and shared-screen. A participant is
        // approved for play as soon as the host adds them.
        ready: true,
        score: 0,
        correctCount: 0,
      },
    ]);
    setParticipantName("");
    setError(null);
  };

  const startQuiz = () => {
    const result = startChurchMatch(players, questions, settings.secondsPerQuestion);
    if (!result.ok) {
      setError(result.reason === "NO_QUESTIONS" ? "Questions are still loading. Please return to settings and try again." : "Add at least two participants.");
      return;
    }
    applyMatchState(result.state);
    goToPhase("question");
  };

  const answerForCurrentPlayer = (selectedIndex: number) => {
    const player = players[currentPlayerIndex];
    if (!player || !currentQuestion || answers[player.id] || phase !== "question") return;

    applyMatchState(recordChurchAnswer(currentMatchState(), player.id, selectedIndex));
  };

  const nextQuestion = () => {
    const next = advanceChurchQuestion(currentMatchState());
    applyMatchState(next);
    goToPhase(next.phase === "results" ? "results" : "question");
  };

  const playAgain = async () => {
    setIsLoading(true);
    const selection = await pickFriendsBattleQuestions(settings.language, 1, settings.difficulty);
    setIsLoading(false);
    const replayQuestions = selection?.questions.slice(0, settings.questionCount) ?? questions;
    applyMatchState(replayChurchMatch(currentMatchState(), replayQuestions));
    goToPhase("lobby");
  };

  return (
    <section ref={sectionRef} className="scroll-mt-24 pb-32 pt-8 sm:pb-20 sm:pt-12" aria-labelledby="church-mode-title">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          key={phase}
        >
          {phase === "welcome" && (
            <div className={`${panelClass} overflow-hidden p-6 sm:p-10`}>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl border border-[#FFD97A]/35 bg-[#D4AF37]/10 text-[#FFD97A] sm:size-24">
                  <Church className="size-10 sm:size-12" aria-hidden="true" />
                </div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Church Mode</p>
                <h2 id="church-mode-title" className="font-serif text-3xl font-bold text-white sm:text-5xl">
                  Bring your group together around God&apos;s Word
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                  Host an in-room Bible quiz for studies, Sunday School, youth groups, and church gatherings.
                </p>
                <button type="button" onClick={() => goToPhase("settings")} className={`${primaryButtonClass} mt-8 w-full sm:w-auto`}>
                  <Plus className="size-5" aria-hidden="true" /> Create Session
                </button>
              </div>
            </div>
          )}

          {phase === "settings" && (
            <div className={`${panelClass} p-5 sm:p-8`}>
              <HeaderBlock icon={Settings2} eyebrow="Create Session" title="Host Settings" onBack={() => goToPhase("welcome")} />
              <form onSubmit={createSession} className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="Church name">
                  <input required maxLength={60} value={settings.churchName} onChange={(event) => setSettings({ ...settings, churchName: event.target.value })} className={fieldClass} placeholder="Grace Community Church" />
                </Field>
                <Field label="Quiz name">
                  <input required maxLength={60} value={settings.quizName} onChange={(event) => setSettings({ ...settings, quizName: event.target.value })} className={fieldClass} placeholder="Sunday Bible Quiz" />
                </Field>
                <Field label="Difficulty">
                  <select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as Difficulty })} className={fieldClass}>
                    {(["Easy", "Medium", "Hard"] as const).map((value) => <option key={value} value={value} className="bg-[#0A1E3D]">{value}</option>)}
                  </select>
                </Field>
                <Field label="Language">
                  <select value={settings.language} onChange={(event) => setSettings({ ...settings, language: event.target.value as LangCode })} className={fieldClass}>
                    {LANGUAGES.filter(({ code }) => code === "en" || code === "am").map(({ code, nativeName }) => <option key={code} value={code} className="bg-[#0A1E3D]">{nativeName}</option>)}
                  </select>
                </Field>
                <Field label="Question count">
                  <select value={settings.questionCount} onChange={(event) => setSettings({ ...settings, questionCount: Number(event.target.value) })} className={fieldClass}>
                    {[5, 10].map((value) => <option key={value} value={value} className="bg-[#0A1E3D]">{value} questions</option>)}
                  </select>
                </Field>
                <Field label="Time per question">
                  <select value={settings.secondsPerQuestion} onChange={(event) => setSettings({ ...settings, secondsPerQuestion: Number(event.target.value) })} className={fieldClass}>
                    {[15, 20, 30, 45].map((value) => <option key={value} value={value} className="bg-[#0A1E3D]">{value} seconds</option>)}
                  </select>
                </Field>
                {error && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}
                <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => goToPhase("welcome")} className={secondaryButtonClass}>Cancel</button>
                  <button type="submit" disabled={isLoading} className={primaryButtonClass}>{isLoading ? "Loading Questions…" : "Continue to Lobby"} {!isLoading && <ChevronRight className="size-5" aria-hidden="true" />}</button>
                </div>
              </form>
            </div>
          )}

          {phase === "lobby" && (
            <div className={`${panelClass} overflow-hidden p-5 sm:p-8`}>
              <HeaderBlock icon={UsersRound} eyebrow={settings.churchName.toLocaleUpperCase()} title={settings.quizName} onBack={resetSession} />
              <div className="mt-7 grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
                <div>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#D4AF37]">Participants</p><h3 className="mt-1 text-2xl font-bold text-white">Your group</h3></div>
                    <div className="text-right" aria-label={`${players.length} of 8 participants`}><span className="text-3xl font-bold text-[#FFD97A]">{players.length}</span><span className="ml-1 text-lg text-white/40">/ 8</span></div>
                  </div>
                  <form onSubmit={addParticipant} className="flex scroll-mb-32 gap-2">
                    <label className="sr-only" htmlFor="church-participant">Participant name</label>
                    <input id="church-participant" autoComplete="name" enterKeyHint="done" maxLength={30} value={participantName} onChange={(event) => setParticipantName(event.target.value)} className={`${fieldClass} mt-0`} placeholder="Participant name" />
                    <button type="submit" disabled={!participantName.trim() || players.length >= 8} className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-[#D4AF37] text-[#07152D] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD97A] disabled:opacity-40" aria-label="Add participant"><Plus className="size-5" aria-hidden="true" /></button>
                  </form>
                  {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
                  <div className="mt-4 space-y-2.5">
                    {players.length === 0 && <div className="rounded-3xl border border-dashed border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] px-5 py-9 text-center"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#FFD97A]"><UsersRound className="size-8" aria-hidden="true" /></div><p className="mt-4 font-semibold text-white">Add your first participant to begin.</p><p className="mt-1 text-sm text-white/50">Names will appear here in the order they join.</p></div>}
                    {players.map((player, index) => (
                      <div key={player.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.075]">
                        <div className="relative grid size-10 shrink-0 place-items-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#FFD97A]"><UserRound className="size-5" aria-hidden="true" /><span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-[#0A1E3D] bg-[#D4AF37] text-[10px] font-bold text-[#07152D]" aria-hidden="true">{index + 1}</span></div>
                        <span className="min-w-0 flex-1 truncate font-semibold text-white">{player.name}</span>
                        <button type="button" onClick={() => setPlayers((current) => current.filter((item) => item.id !== player.id))} className="grid size-11 shrink-0 place-items-center rounded-xl text-white/45 transition hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD97A]" aria-label={`Remove ${player.name}`}><X className="size-5" aria-hidden="true" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <aside className="rounded-3xl border border-[#D4AF37]/25 bg-[linear-gradient(160deg,rgba(212,175,55,.11),rgba(255,255,255,.035))] p-5 sm:p-6 lg:sticky lg:top-24">
                  <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-[#D4AF37]/15 text-[#FFD97A]"><Trophy className="size-6" aria-hidden="true" /></div><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#D4AF37]">Session summary</p><h3 className="mt-0.5 text-xl font-bold text-white">Ready to host</h3></div></div>
                  <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/10 px-4">
                    <SummaryItem label="Church" value={settings.churchName} />
                    <SummaryItem label="Quiz" value={settings.quizName} />
                    <SummaryItem label="Language" value={sessionLanguage} />
                    <SummaryItem label="Difficulty" value={settings.difficulty} />
                    <SummaryItem label="Questions" value={`${questions.length} Questions`} />
                    <SummaryItem label="Timer" value={`${settings.secondsPerQuestion} Seconds`} />
                    <SummaryItem label="Participants" value={`${players.length} ${players.length === 1 ? "Participant" : "Participants"}`} />
                  </dl>
                  <button type="button" onClick={startQuiz} disabled={players.length < 2} className={`${primaryButtonClass} mt-6 min-h-14 w-full text-lg`}><Play className="size-5 fill-current" aria-hidden="true" /> Start Quiz</button>
                  <p className="mt-3 min-h-5 text-center text-sm text-white/55">{players.length < 2 ? "Add at least two participants." : `${players.length} participants are ready to play.`}</p>
                  <button type="button" onClick={resetSession} className={`${secondaryButtonClass} mt-5 w-full`}><ArrowLeft className="size-5" aria-hidden="true" /> Leave Session</button>
                </aside>
              </div>
            </div>
          )}

          {phase === "question" && currentQuestion && (
            <div className={`${panelClass} p-5 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#D4AF37]">Question {questionIndex + 1} of {questions.length}</p><p className="mt-1 text-sm text-white/55">{settings.churchName} · {settings.quizName}</p></div>
                <div className="flex gap-2"><button ref={quitButtonRef} type="button" onClick={() => setQuitOpen(true)} className="min-h-12 rounded-xl border border-red-300/25 bg-red-400/10 px-4 font-semibold text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label="Quit Church Mode session">Quit Session</button><div role="timer" aria-live="polite" aria-label={`${timeLeft} seconds remaining`} className={`flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold ${timeLeft <= 5 ? "border-red-400/40 bg-red-400/10 text-red-200" : "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#FFD97A]"}`}><Clock3 className="size-5" aria-hidden="true" /> {timeLeft}s</div></div>
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className="h-full rounded-full bg-[#D4AF37] transition-[width] duration-300" style={{ width: `${(timeLeft / settings.secondsPerQuestion) * 100}%` }} /></div>
              <div className="mt-7 rounded-3xl border border-white/10 bg-black/10 p-5 sm:p-8">
                <div className="mb-5 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-[#D4AF37]/15 text-[#FFD97A]"><UserRound className="size-5" aria-hidden="true" /></div><div><p className="text-xs uppercase tracking-[.16em] text-white/45">Answering now</p><p className="font-bold text-white">{players[currentPlayerIndex]?.name}</p></div></div>
                <h2 className="text-xl font-bold leading-snug text-white sm:text-3xl">{currentQuestion.question}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {currentQuestion.choices.map((choice, index) => (
                    <button key={`${currentQuestion.id}-${index}`} type="button" onClick={() => answerForCurrentPlayer(index)} className="flex min-h-16 items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-left text-base font-semibold text-white transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/10 active:scale-[.99] sm:min-h-20 sm:text-lg" aria-label={`Answer ${String.fromCharCode(65 + index)}: ${choice}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm text-[#FFD97A]">{String.fromCharCode(65 + index)}</span><span>{choice}</span></button>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Participant answer status">
                {players.map((player, index) => <span key={player.id} className={`rounded-full px-3 py-2 text-xs font-bold ${answers[player.id] ? "bg-emerald-400/15 text-emerald-300" : index === currentPlayerIndex ? "bg-[#D4AF37]/20 text-[#FFD97A]" : "bg-white/[0.06] text-white/45"}`}>{player.name}{answers[player.id] ? " ✓" : ""}</span>)}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4" aria-label="Current score summary"><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-white/45">Current ranking</p><div className="flex flex-wrap gap-2">{rankedPlayers.map((player, index) => <span key={player.id} className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/70"><strong className="text-[#FFD97A]">{index + 1}</strong> {player.name} · {player.score}</span>)}</div></div>
            </div>
          )}

          {phase === "reveal" && currentQuestion && (
            <div className={`${panelClass} p-5 sm:p-8`}>
              <div className="flex justify-end"><button ref={quitButtonRef} type="button" onClick={() => setQuitOpen(true)} className="min-h-12 rounded-xl border border-red-300/25 bg-red-400/10 px-4 font-semibold text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Quit Session</button></div>
              <div className="text-center" aria-live="assertive"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Check className="size-8" aria-hidden="true" /></div><p className="mt-4 text-sm font-bold uppercase tracking-[.18em] text-[#D4AF37]">Correct answer revealed</p><h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">{currentQuestion.choices[currentQuestion.correctIndex]}</h2>{currentQuestion.reference && <p className="mt-3 font-semibold text-[#FFD97A]">{currentQuestion.reference}</p>}{currentQuestion.explanation && <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/65">{currentQuestion.explanation}</p>}</div>
              <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                {players.map((player) => { const result = answers[player.id]; return <div key={player.id} className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4"><span className="font-semibold text-white">{player.name}</span><span className={`font-bold ${result?.isCorrect ? "text-emerald-300" : "text-red-300"}`}>{result?.isCorrect ? "+100" : result?.selectedIndex === null ? "Timed out" : "Incorrect"}</span></div>; })}
              </div>
              <div className="mt-8 flex justify-center"><button type="button" onClick={nextQuestion} className={`${primaryButtonClass} w-full sm:w-auto`}>{questionIndex === questions.length - 1 ? "See Results" : "Next Question"}<ChevronRight className="size-5" aria-hidden="true" /></button></div>
            </div>
          )}

          {phase === "results" && rankedPlayers[0] && (
            <div className={`${panelClass} p-5 sm:p-8`}>
              <div className="text-center" aria-live="polite"><div className="mx-auto grid size-20 place-items-center rounded-3xl border border-[#FFD97A]/35 bg-[#D4AF37]/15 text-[#FFD97A]"><Crown className="size-10" aria-hidden="true" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[.2em] text-[#D4AF37]">Church Mode Champion</p><h2 className="mt-2 font-serif text-4xl font-bold text-white sm:text-5xl">{rankedPlayers[0].name}</h2><p className="mt-2 text-white/60">{settings.churchName} · {settings.quizName}</p></div>
              <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-white/10">
                {rankedPlayers.map((player, index) => <div key={player.id} className="grid min-h-20 grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 last:border-b-0 sm:px-6"><span className={`grid size-9 place-items-center rounded-xl font-bold ${index === 0 ? "bg-[#D4AF37] text-[#07152D]" : "bg-white/10 text-white/65"}`}>{index + 1}</span><div className="min-w-0"><p className="truncate font-bold text-white">{player.name}</p><p className="text-sm text-white/50">{player.correctCount}/{questions.length} correct · {getChurchAccuracy(player.correctCount, questions.length)}% accuracy</p></div><strong className="text-[#FFD97A]">{player.score}</strong></div>)}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={playAgain} disabled={isLoading} className={primaryButtonClass}><RotateCcw className="size-5" aria-hidden="true" /> {isLoading ? "Loading…" : "Play Again"}</button><button type="button" onClick={() => window.location.assign("/")} className={secondaryButtonClass}><ArrowLeft className="size-5" aria-hidden="true" /> Return Home</button></div>
            </div>
          )}
        </motion.div>
      </div>
      {quitOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setQuitOpen(false); window.requestAnimationFrame(() => quitButtonRef.current?.focus()); } }}>
          <div ref={quitDialogRef} role="alertdialog" aria-modal="true" aria-labelledby="church-quit-title" aria-describedby="church-quit-description" tabIndex={-1} className={`${panelClass} w-full max-w-md p-6 outline-none sm:p-8`}>
            <div className="grid size-14 place-items-center rounded-2xl bg-red-400/10 text-red-200"><AlertTriangle className="size-7" aria-hidden="true" /></div>
            <h2 id="church-quit-title" className="mt-5 text-2xl font-bold text-white">Quit Church Session?</h2>
            <p id="church-quit-description" className="mt-3 leading-7 text-white/65">The current quiz and scores will be discarded. No XP, rewards, or progress will be saved.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
              <button type="button" onClick={resetSession} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-red-500 px-5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">End Session</button>
              <button type="button" onClick={() => { setQuitOpen(false); window.requestAnimationFrame(() => quitButtonRef.current?.focus()); }} className={`${secondaryButtonClass} flex-1`}>Continue Playing</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-white/75">{label}{children}</label>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="flex min-h-12 items-center justify-between gap-4 py-2.5"><dt className="text-sm text-white/50">{label}</dt><dd className="max-w-[65%] truncate text-right text-sm font-semibold text-white" title={value}>{value}</dd></div>;
}

function HeaderBlock({ icon: Icon, eyebrow, title, onBack }: { icon: typeof Church; eyebrow: string; title: string; onBack: () => void }) {
  return <div className="flex items-start gap-3"><button type="button" onClick={onBack} className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:text-white" aria-label="Go back"><ArrowLeft className="size-5" aria-hidden="true" /></button><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#D4AF37]/15 text-[#FFD97A]"><Icon className="size-6" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[.18em] text-[#D4AF37]">{eyebrow}</p><h2 id="church-mode-title" className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h2></div></div>;
}
