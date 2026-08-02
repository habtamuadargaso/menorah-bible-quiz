"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { LangCode } from "@/lib/i18n/locales";
import { friendsBattleReducer } from "@/lib/friendsBattle/engine";
import { pickFriendsBattleQuestions } from "@/lib/friendsBattle/localQuestions";
import { saveFriendsBattleMatch, loadFriendsBattleMatch, clearFriendsBattleMatch } from "@/lib/friendsBattle/storage";
import { FRIENDS_BATTLE_DEFAULT_DIFFICULTY, type Difficulty, type FriendsBattleMatchState } from "@/lib/friendsBattle/types";
import FriendsBattleSetup from "@/components/friendsBattle/FriendsBattleSetup";
import PassDeviceScreen from "@/components/friendsBattle/PassDeviceScreen";
import FriendsBattleQuestionScreen from "@/components/friendsBattle/FriendsBattleQuestionScreen";
import AnswerSavedScreen from "@/components/friendsBattle/AnswerSavedScreen";
import FriendsBattleReveal from "@/components/friendsBattle/FriendsBattleReveal";
import FriendsBattleFinal from "@/components/friendsBattle/FriendsBattleFinal";
import FriendsBattleQuitDialog from "@/components/friendsBattle/FriendsBattleQuitDialog";

const ANSWER_SAVED_PAUSE_MS = 1400;

const INITIAL_STATE: FriendsBattleMatchState = {
  phase: "setup",
  language: "en",
  level: 1,
  difficulty: FRIENDS_BATTLE_DEFAULT_DIFFICULTY,
  players: [],
  questions: [],
  questionIndex: 0,
  currentPlayerIndex: 0,
  answersForCurrentQuestion: [],
  completedRounds: [],
};

/**
 * Friends Battle — local pass-and-play, entirely separate from Live
 * Battle (/multiplayer). No Supabase rooms/room_players/room_questions/
 * answers, no realtime, no room code: every bit of state below lives only
 * in this component (plus its own dedicated localStorage key — see
 * lib/friendsBattle/storage.ts) and is driven purely by button presses and
 * a local per-turn timer.
 */
export default function FriendsBattlePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, dispatch] = useReducer(friendsBattleReducer, INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const quitButtonRef = useRef<HTMLButtonElement>(null);

  // Rehydrate an in-progress match after mount only (client-only storage
  // read), so the server-rendered HTML always matches the first client
  // render and there's no hydration mismatch — same pattern LanguageContext
  // already uses for the saved language.
  useEffect(() => {
    const saved = loadFriendsBattleMatch();
    if (saved && saved.phase !== "setup" && saved.phase !== "final") {
      dispatch({ type: "REHYDRATE", state: saved });
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (state.phase === "setup" || state.phase === "final") {
      clearFriendsBattleMatch();
    } else {
      saveFriendsBattleMatch(state);
    }
  }, [state, hydrated]);

  // "Answer Saved" is a brief, non-interactive pause — it auto-advances to
  // either the next player's pass screen or, once everyone has gone, the
  // group reveal. Nothing the player does here can skip or repeat a turn.
  useEffect(() => {
    if (state.phase !== "answerSaved" || quitOpen) return;
    const id = window.setTimeout(() => dispatch({ type: "ADVANCE_AFTER_ANSWER_SAVED" }), ANSWER_SAVED_PAUSE_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.answersForCurrentQuestion.length, quitOpen]);

  const handleContinuePlaying = useCallback(() => {
    setQuitOpen(false);
    window.requestAnimationFrame(() => quitButtonRef.current?.focus());
  }, []);

  function handleQuitMatch() {
    clearFriendsBattleMatch();
    setQuitOpen(false);
    dispatch({ type: "REHYDRATE", state: INITIAL_STATE });
  }

  // Returns true once the match has actually started, false when neither
  // the local bank nor published DB content could form a full round —
  // FriendsBattleSetup surfaces that as an explicit error message rather
  // than silently doing nothing.
  async function handleStart(input: { language: LangCode; level: number; difficulty: Difficulty; playerNames: string[] }): Promise<boolean> {
    const selection = await pickFriendsBattleQuestions(input.language, input.level, input.difficulty);
    if (!selection) return false;
    dispatch({
      type: "START_MATCH",
      language: input.language,
      level: input.level,
      difficulty: input.difficulty,
      playerNames: input.playerNames,
      questions: selection.questions,
    });
    return true;
  }

  // Play Again keeps language/level/difficulty/players fixed but draws a
  // freshly shuffled set of questions (still respecting the same
  // language + difficulty fallback rules as the initial start).
  async function handlePlayAgain() {
    const selection = await pickFriendsBattleQuestions(state.language, state.level, state.difficulty);
    if (!selection) return; // extremely unlikely (content existed a moment ago) — defensive no-op
    dispatch({ type: "PLAY_AGAIN", questions: selection.questions });
  }

  function handleHome() {
    clearFriendsBattleMatch();
    router.push("/");
  }

  if (state.phase === "setup") {
    return <FriendsBattleSetup t={t} onStart={handleStart} />;
  }

  const currentQuestion = state.questions[state.questionIndex];
  const currentPlayer = state.players[state.currentPlayerIndex];

  let matchScreen;
  switch (state.phase) {
    case "passDevice":
      matchScreen = (
        <PassDeviceScreen
          key={`${state.questionIndex}-${state.currentPlayerIndex}-pass`}
          t={t}
          playerName={currentPlayer.name}
          questionNumber={state.questionIndex + 1}
          questionCount={state.questions.length}
          onReady={() => dispatch({ type: "PLAYER_READY" })}
        />
      );
      break;

    case "question":
      matchScreen = (
        <FriendsBattleQuestionScreen
          key={`${state.questionIndex}-${state.currentPlayerIndex}-question`}
          t={t}
          question={currentQuestion}
          playerName={currentPlayer.name}
          questionNumber={state.questionIndex + 1}
          questionCount={state.questions.length}
          difficulty={state.difficulty}
          paused={quitOpen}
          onAnswer={(index) => dispatch({ type: "SUBMIT_ANSWER", selectedIndex: index })}
          onTimeout={() => dispatch({ type: "TIMEOUT" })}
        />
      );
      break;

    case "answerSaved": {
      const everyoneAnswered = state.answersForCurrentQuestion.length >= state.players.length;
      const nextPlayerName = everyoneAnswered ? null : state.players[state.currentPlayerIndex + 1]?.name ?? null;
      matchScreen = <AnswerSavedScreen t={t} nextPlayerName={nextPlayerName} />;
      break;
    }

    case "reveal":
      matchScreen = (
        <FriendsBattleReveal
          key={`${state.questionIndex}-reveal`}
          t={t}
          question={currentQuestion}
          players={state.players}
          answers={state.answersForCurrentQuestion}
          isFinalQuestion={state.questionIndex + 1 >= state.questions.length}
          onContinue={() => dispatch({ type: "CONTINUE_AFTER_REVEAL" })}
        />
      );
      break;

    case "final":
      return <FriendsBattleFinal t={t} players={state.players} onPlayAgain={handlePlayAgain} onHome={handleHome} />;

    default:
      return null;
  }

  return (
    <>
      {matchScreen}
      <button
        ref={quitButtonRef}
        type="button"
        onClick={() => setQuitOpen(true)}
        aria-label="Quit Friends Battle"
        aria-haspopup="dialog"
        aria-expanded={quitOpen}
        className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-navy-950/80 px-3 text-sm font-bold text-[#f3efe2] shadow-premium backdrop-blur-md outline-none transition-colors hover:border-gold-500/40 hover:bg-navy-900 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Quit</span>
      </button>
      <FriendsBattleQuitDialog open={quitOpen} onContinue={handleContinuePlaying} onQuit={handleQuitMatch} />
    </>
  );
}
