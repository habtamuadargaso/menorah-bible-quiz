"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { questionsForLevel } from "@/lib/questions";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { playCorrectSound, playFinishSound, playTimeoutSound, playWrongSound, startGameMusic, stopGameMusic } from "@/lib/sound";
import { getLevelConfig } from "@/lib/game/levelConfig";
import type { BattleConfig, BattlePlayer } from "./BattleSetup";



type Response = { choice: number; elapsedMs: number };
type PlayerState = BattlePlayer & { score: number; correct: number; wrong: number; fastestMs: number | null; streak: number };

export default function BattleArena({ config, onExit, onRematch }: { config: BattleConfig; onExit: () => void; onRematch: () => void }) {
  const { lang, t } = useLanguage();
  const roundSeconds = getLevelConfig(config.level).timerSeconds;
  const { questions, usedFallback } = useMemo(
    () => questionsForLevel(lang, config.categoryId, config.level),
    [lang, config.categoryId, config.level],
  );
  const [players, setPlayers] = useState<PlayerState[]>(() => config.players.map((player) => ({ ...player, score: 0, correct: 0, wrong: 0, fastestMs: null, streak: 0 })));
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(roundSeconds);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const roundStartedAt = useRef(Date.now());
  const nextTimer = useRef<number | null>(null);
  const current = questions[index];

  useEffect(() => {
    startGameMusic();
    return () => {
      stopGameMusic();
      if (nextTimer.current !== null) window.clearTimeout(nextTimer.current);
    };
  }, []);

  useEffect(() => {
    if (finished || revealed || !current) return;
    if (timeLeft <= 0) {
      playTimeoutSound();
      revealRound(responses);
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, revealed, finished, current]);

  useEffect(() => {
    if (!revealed && Object.keys(responses).length === players.length && players.length > 0) revealRound(responses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, players.length, revealed]);

  function answer(playerId: string, choice: number) {
    if (revealed || finished || responses[playerId] || !current) return;
    setResponses((existing) => ({
      ...existing,
      [playerId]: { choice, elapsedMs: Date.now() - roundStartedAt.current },
    }));
  }

  function revealRound(snapshot: Record<string, Response>) {
    if (revealed || !current) return;
    setRevealed(true);
    const correctResponses = Object.entries(snapshot)
      .filter(([, response]) => response.choice === current.correctIndex)
      .sort((a, b) => a[1].elapsedMs - b[1].elapsedMs);
    const rank = new Map(correctResponses.map(([playerId], order) => [playerId, order]));
    const base = [100, 75, 50, 25];
    const multiplier = index === 9 ? 2 : 1;

    if (correctResponses.length > 0) playCorrectSound();
    else playWrongSound();

    setPlayers((currentPlayers) => currentPlayers.map((player) => {
      const response = snapshot[player.id];
      if (!response) return { ...player, streak: 0 };
      const isCorrect = response.choice === current.correctIndex;
      if (!isCorrect) return { ...player, score: Math.max(0, player.score - 10), wrong: player.wrong + 1, streak: 0 };
      const order = rank.get(player.id) ?? 3;
      const speedBonus = response.elapsedMs <= 3000 ? 20 : 0;
      const points = ((base[Math.min(order, 3)] ?? 25) + speedBonus) * multiplier;
      return {
        ...player,
        score: player.score + points,
        correct: player.correct + 1,
        streak: player.streak + 1,
        fastestMs: player.fastestMs === null ? response.elapsedMs : Math.min(player.fastestMs, response.elapsedMs),
      };
    }));

    nextTimer.current = window.setTimeout(() => {
      if (index >= questions.length - 1) {
        setFinished(true);
        stopGameMusic();
        playFinishSound();
      } else {
        setIndex((value) => value + 1);
        setResponses({});
        setRevealed(false);
        setTimeLeft(roundSeconds);
        roundStartedAt.current = Date.now();
      }
    }, 2600);
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score || b.correct - a.correct);

  if (!current) {
    return <section className="mx-auto max-w-xl px-5 py-24 text-center text-[#d8dce5]">{t.quiz.noQuestions}</section>;
  }

  if (finished) {
    const winner = sortedPlayers[0];
    return (
      <section className="mx-auto max-w-3xl px-5 py-16">
        <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[30px] border border-gold-500/30 bg-white/[0.05] p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:p-11">
          <div className="text-6xl">🏆</div>
          <div className="mt-4 text-sm font-extrabold uppercase tracking-[.25em] text-gold-500">{t.battle.champion}</div>
          <h2 className="mt-2 font-display text-4xl font-bold text-[#fbf6e8]">{winner?.name}</h2>
          <p className="mt-2 text-[#aab1bf]">{winner?.score} {t.battle.battlePoints} · {winner?.correct}/10 {t.battle.correctShort}</p>

          <div className="mx-auto mt-8 max-w-xl space-y-3 text-left">
            {sortedPlayers.map((player, position) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-950/55 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{position === 0 ? "🥇" : position === 1 ? "🥈" : position === 2 ? "🥉" : `${position + 1}.`}</span>
                  <div><div className="font-bold text-[#f6f0df]">{player.name}</div><div className="text-xs text-[#929aa9]">{player.correct} {t.battle.correctShort} · {player.wrong} {t.battle.wrongShort} · {t.battle.fastest} {player.fastestMs ? `${(player.fastestMs / 1000).toFixed(1)}s` : "—"}</div></div>
                </div>
                <div className="text-xl font-black text-gold-400">{player.score}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={onExit} className="rounded-full border border-white/20 px-7 py-3 font-bold text-[#d8dce5] hover:bg-white/5">{t.battle.exit}</button>
            <button onClick={onRematch} className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-9 py-3 font-extrabold text-navy-950 shadow-gold">{t.battle.rematch}</button>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-5">
      {usedFallback && <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-2 text-center text-xs text-gold-300">{t.quiz.fallbackNotice}</div>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs font-bold uppercase tracking-[.2em] text-gold-500">⚔ {t.battle.title} · {t.common.level} {config.level}</div><div className="mt-1 text-sm text-[#a9b0be]">{t.quiz.questionLabel} {index + 1} {t.quiz.ofLabel} 10 {index === 9 && `· ${t.battle.doublePoints}`}</div></div>
        <button onClick={onExit} className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-[#d7dbe4] hover:bg-white/5">{t.quiz.quit}</button>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-gradient-to-r from-gold-600 to-gold-300" animate={{ width: `${((index + 1) / 10) * 100}%` }} /></div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="rounded-[28px] border border-gold-500/25 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,.4)] sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-gold-500/30 bg-navy-950 text-2xl font-black text-gold-400">{timeLeft}</div>
          <h2 className="mx-auto max-w-4xl text-center font-display text-2xl font-bold leading-snug text-[#fbf6e8] sm:text-3xl">{current.question}</h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {players.map((player) => {
              const response = responses[player.id];
              return (
                <div key={player.id} className="rounded-2xl border border-white/12 bg-navy-950/45 p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="font-bold text-[#f7f0dc]">{player.name}</div><div className="text-sm font-black text-gold-400">{player.score} {t.battle.pointsShort}</div></div>
                  {response && !revealed ? (
                    <div className="flex min-h-[116px] items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/5 text-center"><div><div className="text-2xl">🔒</div><div className="mt-1 font-bold text-gold-300">{t.battle.answerLocked}</div></div></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {current.choices.map((choice, choiceIndex) => {
                        const selected = response?.choice === choiceIndex;
                        const correct = choiceIndex === current.correctIndex;
                        let style = "border-white/12 bg-white/[0.035] text-[#eee9dc] hover:border-gold-500/45";
                        if (revealed && correct) style = "border-emerald-400/70 bg-emerald-500/15 text-emerald-100";
                        else if (revealed && selected && !correct) style = "border-red-400/70 bg-red-500/15 text-red-100";
                        return (
                          <button key={choiceIndex} disabled={!!response || revealed} onClick={() => answer(player.id, choiceIndex)} className={`min-h-[54px] rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${style} disabled:cursor-default`}>
                            <span className="mr-2 font-black text-gold-400">{String.fromCharCode(65 + choiceIndex)}.</span>{choice}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl border border-gold-500/20 bg-navy-950/60 p-5 text-center">
              <div className="font-bold text-gold-400">{current.reference}</div>
              <p className="mt-1 text-sm leading-relaxed text-[#c3c9d3]">{current.explanation}</p>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-[#9098a7]">{t.battle.nextLoading}</div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {sortedPlayers.map((player, position) => <div key={player.id} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-bold text-[#d9dde5]">{position + 1}. {player.name} · <span className="text-gold-400">{player.score}</span></div>)}
      </div>
    </section>
  );
}
