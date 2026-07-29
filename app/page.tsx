"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

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
import MobileAppShell from "@/components/mobile/MobileAppShell";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileSection from "@/components/mobile/MobileSection";
import MobileActionCard from "@/components/mobile/MobileActionCard";
import MobileHero from "@/components/mobile/MobileHero";
import MobileProgressCards from "@/components/mobile/MobileProgressCards";
import MobileDailyReward from "@/components/mobile/MobileDailyReward";
import MobileVerseCard from "@/components/mobile/MobileVerseCard";
import MobileComingSoonSummary from "@/components/mobile/MobileComingSoonSummary";
import MobileCampaignJourney from "@/components/mobile/MobileCampaignJourney";
import MobileLevelComplete from "@/components/mobile/MobileLevelComplete";
import MobileLeaderboardPreview from "@/components/mobile/MobileLeaderboardPreview";
import { Play, Calendar, Church, Swords, Users } from "lucide-react";

import {
  loadLeaderboard,
  type ScoreEntry,
} from "@/lib/leaderboard";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  addQuizRewards,
  loadProgress,
  levelForXp,
  type Progress,
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
import { recordCompletedQuiz, loadProfileStats, type ProfileStats } from "@/lib/profileStats";

type Stage =
  | "categories"
  | "quiz"
  | "result"
  | "leaderboard"
  | "profile";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

// Mission 15 — split out so useSearchParams() (needed for the /learn
// category hand-off above) doesn't force the whole "/" route out of static
// prerendering; only this inner component opts into the suspense boundary.
function HomeInner() {
  const { lang, t } = useLanguage();
  const isAmharic = lang === "am";
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  // Mission 16 — mobile-only: whether the phone should show the campaign
  // journey list or the active gameplay screen for the current `stage ===
  // "quiz"` visit. Desktop always shows both CampaignMap + QuizCard
  // together (unchanged), so this flag has no effect there.
  const [mobileGameActive, setMobileGameActive] = useState(false);
  const [mobileProgress, setMobileProgress] = useState<Progress>({ totalXp: 0, coins: 0, quizzesCompleted: 0 });
  const [mobileStats, setMobileStats] = useState<ProfileStats | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const challengesRef = useRef<HTMLDivElement>(null);
  const bibleRef = useRef<HTMLDivElement>(null);
  const churchRef = useRef<HTMLDivElement>(null);
  // Mission 15.5 — mobile's "Daily Challenge"/"Church Mode" action cards
  // still scroll to these refs, but the target content below them is now
  // the compact MobileDailyReward/MobileComingSoonSummary cards rather than
  // the full desktop ChallengesStrip/ChurchModeSection, so they need their
  // own refs distinct from the desktop-only ones above.
  const mobileChallengesRef = useRef<HTMLDivElement>(null);
  const mobileChurchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(loadLeaderboard());
    setCampaignProgress(loadCampaignProgress());
    setMobileProgress(loadProgress());
    setMobileStats(loadProfileStats());
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
    setMobileGameActive(false);
    scrollTo(gameRef);
  }

  // Mission 15 — the mobile /learn route can't launch the quiz directly
  // (categoryId/gameLevel/stage live only here), so it hands off a
  // ?category= param instead. Consume it once on mount, then strip it from
  // the URL so it doesn't re-trigger on back/forward navigation.
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && CATEGORIES.some((c) => c.id === categoryParam)) {
      handleSelectCategory(categoryParam as CategoryId);
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      setMobileGameActive(true);
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
    setMobileGameActive(true);
    scrollTo(gameRef);
  }

  function handleSelectCampaignLevel(level: number) {
    setGameLevel(level);
    setStage("quiz");
    setMobileGameActive(true);
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
      id="main-content"
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

      <div className="hidden md:block">
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
      </div>

      <div className="md:hidden">
        {stage === "categories" && (
          <MobileAppShell>
            <MobileHero
              displayName={user?.displayName ?? t.common.guest}
              isGuest={isGuest}
              isAmharic={isAmharic}
              level={levelForXp(mobileProgress.totalXp).level}
              progressPct={levelForXp(mobileProgress.totalXp).progressPct}
              xpIntoLevel={levelForXp(mobileProgress.totalXp).xpIntoLevel}
              xpForNextLevel={levelForXp(mobileProgress.totalXp).xpForNextLevel}
              coins={mobileProgress.coins}
              streak={mobileStats?.currentDayStreak ?? 0}
              onContinue={() => router.push("/learn")}
            />

            <MobileVerseCard />

            <MobileSection title={isAmharic ? "ተጫወት" : "Play"}>
              <MobileActionCard
                icon={<Play className="h-5 w-5" aria-hidden />}
                title={isAmharic ? "ብቻዬን ተጫወት" : "Solo Quiz"}
                subtitle={isAmharic ? "10 ደረጃዎችን ያልፉ" : "Play alone through 10 levels"}
                href="/learn"
                accent="blue"
              />
              <MobileActionCard
                icon={<Calendar className="h-5 w-5" aria-hidden />}
                title={isAmharic ? "የዕለቱ ፈተና" : "Daily Challenge"}
                subtitle={isAmharic ? "ዕለታዊ ሽልማት ይሰብስቡ" : "Claim today's reward"}
                onClick={() => scrollTo(mobileChallengesRef)}
                accent="amber"
              />
              <MobileActionCard
                icon={<Church className="h-5 w-5" aria-hidden />}
                title={isAmharic ? "የቤተ ክርስቲያን ሁነታ" : "Church Mode"}
                subtitle={isAmharic ? "ለቡድን ውድድር" : "Host a group competition"}
                onClick={() => scrollTo(mobileChurchRef)}
                accent="purple"
              />
            </MobileSection>

            <MobileSection title={isAmharic ? "ተወዳደር" : "Compete"}>
              <MobileActionCard
                icon={<Swords className="h-5 w-5" aria-hidden />}
                title={isAmharic ? "የቀጥታ ውድድር" : "Live Battle"}
                subtitle={isAmharic ? "በክፍል ኮድ ተቀላቀሉ" : "Create or join a room"}
                onClick={handleBattleSetup}
                theme="navy-outline"
                accent="violet"
              />
              <MobileActionCard
                icon={<Users className="h-5 w-5" aria-hidden />}
                title={isAmharic ? "የጓደኞች ውድድር" : "Friends Battle"}
                subtitle={isAmharic ? "በአንድ መሳሪያ ይጫወቱ" : "Pass-and-play on one device"}
                href="/friends-battle"
                theme="navy-outline"
                accent="teal"
              />
            </MobileSection>

            <MobileSection title={isAmharic ? "እድገትዎ" : "Your Progress"}>
              <MobileProgressCards
                level={levelForXp(mobileProgress.totalXp).level}
                progressPct={levelForXp(mobileProgress.totalXp).progressPct}
                coins={mobileProgress.coins}
                streak={mobileStats?.currentDayStreak ?? 0}
                levelLabel={t.common.level}
                coinsLabel={t.profile.totalCoins}
                streakLabel={t.profile.currentStreak}
              />
            </MobileSection>

            <MobileSection title={t.nav.leaderboard} action={{ label: isAmharic ? "ሁሉንም ይመልከቱ" : "See all", onClick: () => router.push("/leaderboard") }}>
              <MobileLeaderboardPreview
                entries={entries}
                onViewAll={() => router.push("/leaderboard")}
                currentPlayerName={user?.displayName}
              />
            </MobileSection>

            <MobileSection title={isAmharic ? "ዕለታዊ ሽልማት" : "Daily Reward"}>
              <div ref={mobileChallengesRef} className="flex flex-col gap-2.5">
                <MobileDailyReward isAmharic={isAmharic} />
                <MobileComingSoonSummary
                  heading={t.challenges.heading}
                  items={[t.challenges.daily.title, t.challenges.weekly.title]}
                  isAmharic={isAmharic}
                />
              </div>
            </MobileSection>

            <MobileSection title={t.church.heading}>
              <div ref={mobileChurchRef}>
                <MobileComingSoonSummary
                  heading={isAmharic ? "ተጨማሪ ይመጣል" : "More on the way"}
                  items={[
                    t.church.competition.title,
                    t.church.youthChallenge.title,
                    t.church.sundaySchool.title,
                    t.church.teamVsTeam.title,
                    t.church.dashboard.title,
                  ]}
                  isAmharic={isAmharic}
                />
              </div>
            </MobileSection>
          </MobileAppShell>
        )}

        {stage === "quiz" && categoryId && (
          <AnimatePresence mode="wait">
            {!mobileGameActive ? (
              <motion.div
                key="campaign"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <MobileCampaignJourney
                  categoryId={categoryId}
                  activeLevel={gameLevel}
                  progress={campaignProgress}
                  onSelectLevel={handleSelectCampaignLevel}
                />
              </motion.div>
            ) : (
              <motion.div
                key="gameplay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <QuizCard
                  key={`${lang}-${categoryId}-${gameLevel}-mobile`}
                  categoryId={categoryId}
                  difficulty={difficultyForLevel(gameLevel)}
                  level={gameLevel}
                  onFinish={handleFinish}
                  onExit={() => {
                    setStage("categories");
                    setMobileGameActive(false);
                  }}
                  variant="mobile"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {stage === "result" && result && (
          <MobileLevelComplete
            result={result}
            newBadges={newBadges}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            canNextLevel={hasPassedLevel(result.correct, result.total) && gameLevel < MAX_GAME_LEVEL}
            onCategories={() => {
              setStage("categories");
              setMobileGameActive(false);
            }}
            onLeaderboard={handleLeaderboard}
          />
        )}

        {stage === "leaderboard" && (
          <>
            <Leaderboard entries={entries} />
            <MobileBottomNav />
          </>
        )}

        {stage === "profile" && (
          <>
            <ProfilePage
              onCategories={() => {
                setStage("categories");
                scrollTo(gameRef);
              }}
              onLeaderboard={handleLeaderboard}
            />
            <MobileBottomNav />
          </>
        )}
      </div>

      <LanguageModal
        open={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onContinue={handleLanguageContinue}
      />

      <Footer />
    </main>
  );
}