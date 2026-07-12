"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import CategoryGrid from "@/components/CategoryGrid";
import QuizCard, { type QuizResult } from "@/components/QuizCard";
import ResultCard from "@/components/ResultCard";
import Leaderboard from "@/components/Leaderboard";
import ChallengesStrip from "@/components/ChallengesStrip";
import BibleLearningSection from "@/components/BibleLearningSection";
import ChurchModeSection from "@/components/ChurchModeSection";
import Footer from "@/components/Footer";
import Confetti from "@/components/Confetti";
import CampaignMap from "@/components/CampaignMap";
import BattleLauncher from "@/components/BattleLauncher";
import BattleSetup, { type BattleConfig } from "@/components/BattleSetup";
import BattleArena from "@/components/BattleArena";
import { loadLeaderboard, type ScoreEntry } from "@/lib/leaderboard";
import type { CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { addQuizRewards, levelForXp } from "@/lib/progress";
import { checkAchievements, type AchievementId } from "@/lib/achievements";
import { difficultyForLevel, MAX_GAME_LEVEL } from "@/lib/levels";
import { hasPassedLevel, loadCampaignProgress, unlockNextCampaignLevel, type CampaignProgress } from "@/lib/campaign";

type Stage = "categories" | "quiz" | "result" | "leaderboard" | "battle-setup" | "battle";

export default function Home() {
  const { lang } = useLanguage();
  const [stage, setStage] = useState<Stage>("categories");
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [gameLevel, setGameLevel] = useState(1);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [newBadges, setNewBadges] = useState<AchievementId[]>([]);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress>({});
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);
  const bibleRef = useRef<HTMLDivElement>(null);
  const churchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(loadLeaderboard());
    setCampaignProgress(loadCampaignProgress());
  }, [stage]);

  function scrollTo(ref: RefObject<HTMLDivElement>) {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function handleStart() {
    setStage("categories");
    scrollTo(gameRef);
  }

  function handleSelectCategory(id: CategoryId) {
    setCategoryId(id);
    setGameLevel(1);
    setStage("quiz");
    scrollTo(gameRef);
  }


  function handleFinish(res: QuizResult) {
    const progressUpdate = addQuizRewards(res.xpEarned, res.coinsEarned);
    const playerLevel = levelForXp(progressUpdate.progress.totalXp).level;
    const unlocked = checkAchievements({
      correct: res.correct,
      total: res.total,
      bestStreak: res.bestStreak,
      difficulty: res.difficulty,
      lang,
      fastAnswers: res.fastAnswers,
      playerLevel,
      totalQuizzesCompleted: progressUpdate.progress.quizzesCompleted,
    });
    setNewBadges(unlocked);
    setResult(res);
    if (hasPassedLevel(res.correct, res.total)) {
      setCampaignProgress(unlockNextCampaignLevel(res.categoryId, res.level));
    } else {
      setCampaignProgress(loadCampaignProgress());
    }
    setStage("result");

    const pct = res.total ? Math.round((res.correct / res.total) * 100) : 0;
    if (pct >= 70) {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 4200);
    }
  }

  function handleRestart() {
    if (categoryId) {
      setStage("quiz");
    }
  }

  function handleNextLevel() {
    if (!categoryId || !result || !hasPassedLevel(result.correct, result.total)) return;
    setGameLevel((level) => Math.min(MAX_GAME_LEVEL, level + 1));
    setStage("quiz");
    scrollTo(gameRef);
  }

  function handleSelectCampaignLevel(level: number) {
    setGameLevel(level);
    setStage("quiz");
    scrollTo(gameRef);
  }

  function handleLeaderboard() {
    setStage("leaderboard");
    scrollTo(gameRef);
  }


  function handleBattleSetup() {
    setStage("battle-setup");
    scrollTo(gameRef);
  }

  function handleStartBattle(config: BattleConfig) {
    setBattleConfig(config);
    setStage("battle");
    scrollTo(gameRef);
  }

  function handleBible() {
    setStage("categories");
    scrollTo(bibleRef);
  }

  function handleChurch() {
    setStage("categories");
    scrollTo(churchRef);
  }

  return (
    <main className="min-h-screen w-full" style={{ background: "linear-gradient(165deg,#050b1c 0%, #0b1f3a 48%, #071122 100%)" }}>
      <Confetti active={confettiActive} />
      <Header
        onHome={handleStart}
        onCategories={() => {
          setStage("categories");
          scrollTo(gameRef);
        }}
        onBible={handleBible}
        onChurch={handleChurch}
        onLeaderboard={handleLeaderboard}
      />
      <Hero onStart={handleStart} onLeaderboard={handleLeaderboard} />

      <div ref={gameRef} />

      <AnimatePresence mode="wait">
        {stage === "categories" && (
          <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <BattleLauncher onStart={handleBattleSetup} />
            <CategoryGrid onSelect={handleSelectCategory} />
            <ChallengesStrip />
            <div ref={bibleRef}>
              <BibleLearningSection />
            </div>
            <div ref={churchRef}>
              <ChurchModeSection />
            </div>
          </motion.div>
        )}

        {stage === "quiz" && categoryId && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <CampaignMap categoryId={categoryId} activeLevel={gameLevel} progress={campaignProgress} onSelectLevel={handleSelectCampaignLevel} />
            <QuizCard
              key={`${lang}-${categoryId}-${gameLevel}`}
              categoryId={categoryId}
              difficulty={difficultyForLevel(gameLevel)}
              level={gameLevel}
              onFinish={handleFinish}
              onExit={() => setStage("categories")}
            />
          </motion.div>
        )}

        {stage === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ResultCard
              result={result}
              newBadges={newBadges}
              onRestart={handleRestart}
              onNextLevel={handleNextLevel}
              canNextLevel={hasPassedLevel(result.correct, result.total) && gameLevel < MAX_GAME_LEVEL}
              onCategories={() => setStage("categories")}
              onLeaderboard={handleLeaderboard}
            />
          </motion.div>
        )}

        {stage === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Leaderboard entries={entries} />
          </motion.div>
        )}

        {stage === "battle-setup" && (
          <motion.div key="battle-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <BattleSetup onStart={handleStartBattle} onBack={() => setStage("categories")} />
          </motion.div>
        )}

        {stage === "battle" && battleConfig && (
          <motion.div key={`battle-${lang}-${battleConfig.categoryId}-${battleConfig.level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <BattleArena
              config={battleConfig}
              onExit={() => setStage("categories")}
              onRematch={() => {
                setBattleConfig({ ...battleConfig, players: battleConfig.players.map((player) => ({ ...player })) });
                setStage("battle-setup");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
