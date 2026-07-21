"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import Hero from "@/components/Hero";
import Header from "@/components/Header";
import DailyVerseBanner from "@/components/DailyVerseBanner";
import BattleLauncher from "@/components/BattleLauncher";
import PlayCards from "@/components/PlayCards";
import ContinuePlaying from "@/components/ContinuePlaying";
import LeaderboardPreview from "@/components/LeaderboardPreview";
import CategoryGrid from "@/components/CategoryGrid";
import QuizCard, {
  type QuizResult,
} from "@/components/QuizCard";
import ResultCard from "@/components/ResultCard";
import ProfilePage from "@/components/profile/ProfilePage";
import Leaderboard from "@/components/Leaderboard";
import ChallengesStrip from "@/components/ChallengesStrip";
import BibleLearningSection from "@/components/BibleLearningSection";
import ChurchModeSection from "@/components/ChurchModeSection";
import Footer from "@/components/Footer";
import Confetti from "@/components/Confetti";
import CampaignMap from "@/components/CampaignMap";
import LanguageModal from "@/components/LanguageModal";

import {
  loadLeaderboard,
  type ScoreEntry,
} from "@/lib/leaderboard";
import type { CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  addQuizRewards,
  levelForXp,
} from "@/lib/progress";
import {
  checkAchievements,
  type AchievementId,
} from "@/lib/achievements";
import {
  difficultyForLevel,
  MAX_GAME_LEVEL,
} from "@/lib/levels";
import {
  hasPassedLevel,
  loadCampaignProgress,
  unlockNextCampaignLevel,
  type CampaignProgress,
} from "@/lib/campaign";
import { recordCompletedQuiz } from "@/lib/profileStats";

type Stage =
  | "categories"
  | "quiz"
  | "result"
  | "leaderboard"
  | "profile";

export default function Home() {
  const { lang } = useLanguage();
  const router = useRouter();

  const [stage, setStage] =
    useState<Stage>("categories");
  const [categoryId, setCategoryId] =
    useState<CategoryId | null>(null);
  const [gameLevel, setGameLevel] = useState(1);
  const [result, setResult] =
    useState<QuizResult | null>(null);
  const [newBadges, setNewBadges] = useState<
    AchievementId[]
  >([]);
  const [entries, setEntries] = useState<
    ScoreEntry[]
  >([]);
  const [confettiActive, setConfettiActive] =
    useState(false);
  const [campaignProgress, setCampaignProgress] =
    useState<CampaignProgress>({});
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const challengesRef = useRef<HTMLDivElement>(null);
  const bibleRef = useRef<HTMLDivElement>(null);
  const churchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(loadLeaderboard());
    setCampaignProgress(loadCampaignProgress());
  }, [stage]);

  function scrollTo(ref: RefObject<HTMLDivElement>) {
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  }

  function handleStart() {
    setStage("categories");
    scrollTo(gameRef);
  }

  function handlePlaySingle() {
    setShowLanguageModal(true);
  }

  function handleLanguageContinue() {
    setShowLanguageModal(false);
    setStage("categories");
    scrollTo(categoriesRef);
  }

  function handleBattleSetup() {
    router.push("/multiplayer");
  }

  function handleDailyChallenge() {
    setStage("categories");
    scrollTo(challengesRef);
  }

  function handleContinueCategory(id: CategoryId, level: number) {
    setCategoryId(id);
    setGameLevel(level);
    setStage("quiz");
    scrollTo(gameRef);
  }

  function handleSelectCategory(id: CategoryId) {
    setCategoryId(id);
    setGameLevel(1);
    setStage("quiz");
    scrollTo(gameRef);
  }

  function handleFinish(res: QuizResult) {
    const progressUpdate = addQuizRewards(
      res.xpEarned,
      res.coinsEarned
    );

    // Purely additive: mirrors a few extra numbers for the Profile screen
    // (questions answered, correct answers, day streak, recent activity).
    // Does not read or affect XP/coins/campaign/achievement state above.
    recordCompletedQuiz(res);

    const playerLevel = levelForXp(
      progressUpdate.progress.totalXp
    ).level;

    const unlocked = checkAchievements({
      correct: res.correct,
      total: res.total,
      bestStreak: res.bestStreak,
      difficulty: res.difficulty,
      lang,
      fastAnswers: res.fastAnswers,
      playerLevel,
      totalQuizzesCompleted:
        progressUpdate.progress.quizzesCompleted,
    });

    setNewBadges(unlocked);
    setResult(res);

    if (hasPassedLevel(res.correct, res.total)) {
      setCampaignProgress(
        unlockNextCampaignLevel(
          res.categoryId,
          res.level
        )
      );
    } else {
      setCampaignProgress(loadCampaignProgress());
    }

    setStage("result");

    const percentage = res.total
      ? Math.round((res.correct / res.total) * 100)
      : 0;

    if (percentage >= 70) {
      setConfettiActive(true);

      window.setTimeout(() => {
        setConfettiActive(false);
      }, 4200);
    }
  }

  function handleRestart() {
    if (categoryId) {
      setStage("quiz");
      scrollTo(gameRef);
    }
  }

  function handleNextLevel() {
    if (
      !categoryId ||
      !result ||
      !hasPassedLevel(result.correct, result.total)
    ) {
      return;
    }

    setGameLevel((level) =>
      Math.min(MAX_GAME_LEVEL, level + 1)
    );
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

  function handleProfile() {
    setStage("profile");
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
    <main
      className="min-h-screen w-full"
      style={{
        background:
          "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)",
      }}
    >
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
        onProfile={handleProfile}
        stage={stage}
      />

      <Hero
        onStart={handleStart}
        onLeaderboard={handleLeaderboard}
      />

      <DailyVerseBanner onExplore={handleBible} />

      <div ref={gameRef} />

      <AnimatePresence mode="wait">
        {stage === "categories" && (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlayCards
              onSinglePlayer={handlePlaySingle}
              onDailyChallenge={handleDailyChallenge}
              onChurchMode={handleChurch}
            />

            <BattleLauncher onStart={handleBattleSetup} />

            <ContinuePlaying
              progress={campaignProgress}
              onContinue={handleContinueCategory}
            />

            <LeaderboardPreview
              entries={entries}
              onViewAll={handleLeaderboard}
            />

            <div ref={challengesRef}>
              <ChallengesStrip />
            </div>

            <div ref={categoriesRef}>
              <CategoryGrid onSelect={handleSelectCategory} />
            </div>

            <div ref={bibleRef}>
              <BibleLearningSection />
            </div>

            <div ref={churchRef}>
              <ChurchModeSection />
            </div>
          </motion.div>
        )}

        {stage === "quiz" && categoryId && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CampaignMap
              categoryId={categoryId}
              activeLevel={gameLevel}
              progress={campaignProgress}
              onSelectLevel={handleSelectCampaignLevel}
            />

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
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResultCard
              result={result}
              newBadges={newBadges}
              onRestart={handleRestart}
              onNextLevel={handleNextLevel}
              canNextLevel={
                hasPassedLevel(
                  result.correct,
                  result.total
                ) && gameLevel < MAX_GAME_LEVEL
              }
              onCategories={() =>
                setStage("categories")
              }
              onLeaderboard={handleLeaderboard}
            />
          </motion.div>
        )}

        {stage === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Leaderboard entries={entries} />
          </motion.div>
        )}

        {stage === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProfilePage
              onCategories={() => {
                setStage("categories");
                scrollTo(gameRef);
              }}
              onLeaderboard={handleLeaderboard}
            />
          </motion.div>
        )}

      </AnimatePresence>

      <LanguageModal
        open={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onContinue={handleLanguageContinue}
      />

      <Footer />
    </main>
  );
}