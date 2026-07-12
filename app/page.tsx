"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import Hero from "@/components/Hero";
import Header from "@/components/Header";
import CategoryGrid from "@/components/CategoryGrid";
import QuizCard, {
  type QuizResult,
} from "@/components/QuizCard";
import ResultCard from "@/components/ResultCard";
import Leaderboard from "@/components/Leaderboard";
import ChallengesStrip from "@/components/ChallengesStrip";
import BibleLearningSection from "@/components/BibleLearningSection";
import ChurchModeSection from "@/components/ChurchModeSection";
import Footer from "@/components/Footer";
import Confetti from "@/components/Confetti";
import CampaignMap from "@/components/CampaignMap";
import BattleLauncher from "@/components/BattleLauncher";
import BattleSetup, {
  type BattleConfig,
} from "@/components/BattleSetup";
import BattleArena from "@/components/BattleArena";

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

type Stage =
  | "categories"
  | "quiz"
  | "result"
  | "leaderboard"
  | "battle-setup"
  | "battle";

export default function Home() {
  const { lang } = useLanguage();

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
  const [battleConfig, setBattleConfig] =
    useState<BattleConfig | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);
  const bibleRef = useRef<HTMLDivElement>(null);
  const churchRef = useRef<HTMLDivElement>(null);

  const isAmharic = lang === "am";

  const onlineBattleText = isAmharic
    ? {
        eyebrow: "የቀጥታ ባለብዙ ተጫዋች ጨዋታ",
        title: "የመጽሐፍ ቅዱስ የመስመር ላይ ውድድር",
        description:
          "ከጓደኞች፣ ከቤተሰብ ወይም ከቤተ ክርስቲያን አባላት ጋር ከተለያዩ ስልኮች ይጫወቱ። ክፍል ይፍጠሩ ወይም በክፍል ኮድ ይቀላቀሉ።",
        createJoin: "ክፍል ፍጠር ወይም ተቀላቀል",
        sameQuestion: "ሁሉም ተጫዋቾች ተመሳሳይ ጥያቄ ያያሉ",
        fastestWins: "ፈጣኑ ትክክለኛ መልስ ከፍተኛ ነጥብ ያገኛል",
        tenQuestions: "10 የቀጥታ ጥያቄዎች",
        online: "የመስመር ላይ",
      }
    : {
        eyebrow: "REAL-TIME MULTIPLAYER",
        title: "Online Bible Battle",
        description:
          "Play with friends, family, or church members from different phones. Create a room or join with a room code.",
        createJoin: "Create Room or Join Room",
        sameQuestion:
          "Every player sees the same question",
        fastestWins:
          "Fastest correct answer earns the most points",
        tenQuestions: "10 live questions",
        online: "Online",
      };

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
    <main
      className="min-h-screen w-full"
      style={{
        background:
          "linear-gradient(165deg,#050b1c 0%,#0b1f3a 48%,#071122 100%)",
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
      />

      <Hero
        onStart={handleStart}
        onLeaderboard={handleLeaderboard}
      />

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
            {/* Online multiplayer battle */}
            <section className="mx-auto max-w-5xl px-5 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-[28px] border border-blue-400/35 bg-gradient-to-br from-blue-500/20 via-white/[0.055] to-cyan-400/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,.38)] sm:p-8"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
                />

                <div className="relative">
                  <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        {onlineBattleText.eyebrow}
                      </div>

                      <h2 className="mt-4 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">
                        🌍⚔️ {onlineBattleText.title}
                      </h2>

                      <p className="mt-3 max-w-xl text-sm leading-7 text-[#c5ccda] sm:text-base">
                        {onlineBattleText.description}
                      </p>

                      <div className="mt-6 grid gap-3 text-sm text-[#d8deea] sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-xl">📱</div>
                          <p className="mt-2">
                            {onlineBattleText.sameQuestion}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-xl">⚡</div>
                          <p className="mt-2">
                            {onlineBattleText.fastestWins}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-xl">🏆</div>
                          <p className="mt-2">
                            {onlineBattleText.tenQuestions}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 lg:w-auto">
                      <Link
                        href="/multiplayer"
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 px-7 py-4 text-center text-base font-extrabold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,.3)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(56,189,248,.45)] lg:min-w-[260px]"
                      >
                        <span className="text-xl">⚔️</span>
                        {onlineBattleText.createJoin}
                      </Link>

                      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {onlineBattleText.online}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Local shared-screen Battle Arena */}
            <BattleLauncher onStart={handleBattleSetup} />

            {/* Solo campaign categories */}
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

        {stage === "battle-setup" && (
          <motion.div
            key="battle-setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BattleSetup
              onStart={handleStartBattle}
              onBack={() => setStage("categories")}
            />
          </motion.div>
        )}

        {stage === "battle" && battleConfig && (
          <motion.div
            key={`battle-${lang}-${battleConfig.categoryId}-${battleConfig.level}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BattleArena
              config={battleConfig}
              onExit={() => setStage("categories")}
              onRematch={() => {
                setBattleConfig({
                  ...battleConfig,
                  players: battleConfig.players.map(
                    (player) => ({
                      ...player,
                    })
                  ),
                });

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