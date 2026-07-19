import type { CategoryId } from "@/lib/categories";
import type { AchievementId } from "@/lib/achievements";

export interface CategoryText {
  title: string;
  blurb: string;
}

/**
 * All translatable UI text for the app. English (lib/i18n/translations/en.ts)
 * is the source of truth / fallback: any key missing in another language's
 * file is filled in from English automatically (see LanguageContext.tsx).
 *
 * NOTE on tier verses: the short Bible verse quotes shown on the result
 * screen are part of the UI strings below. Only English and Amharic have
 * been given real (though still worth double-checking) verse text; every
 * other language intentionally falls back to the English verse until a
 * reviewed translation is added, per the project's rule against
 * auto-translating Scripture without human review.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface UIStrings {
  tagline: string;
  slogan: string;
  nav: {
    home: string;
    categories: string;
    leaderboard: string;
  };
  hero: {
    eyebrow: string;
    startButton: string;
    leaderboardButton: string;
    statCategories: string;
    statQuestions: string;
    statFree: string;
  };
  categoriesSection: {
    heading: string;
    subheading: string;
    questionSingular: string;
    questionPlural: string;
  };
  categories: Record<CategoryId, CategoryText>;
  quiz: {
    quit: string;
    questionLabel: string; // "Question"
    ofLabel: string; // "of" as in "Question 2 of 10"
    streak: string;
    difficulty: {
      Easy: string;
      Medium: string;
      Hard: string;
    };
    nextQuestion: string;
    seeResults: string;
    noQuestions: string;
    backToCategories: string;
    fallbackNotice: string;
  };
  result: {
    tier: {
      master: string;
      scholar: string;
      believer: string;
      keepStudying: string;
    };
    verse: {
      master: string;
      scholar: string;
      believer: string;
      keepStudying: string;
    };
    correct: string;
    accuracy: string;
    score: string;
    points: string;
    namePlaceholder: string;
    saveButton: string;
    savedMessage: string;
    restartButton: string;
    backToCategoriesButton: string;
    leaderboardButton: string;
    headline: {
      perfect: string;
      levelComplete: string;
      keepStudying: string;
    };
    perfectRoundBanner: string;
    stats: {
      wrongAnswers: string;
      timeBonus: string;
      xpEarned: string;
      coinsEarned: string;
      perfectBonusIncluded: string;
    };
    playerProgress: string;
    nextPlayerLevel: string;
    fastSuffix: string;
    encouragementHeading: string;
    shareLabel: string;
    shareButton: string;
    shareCopied: string;
    shareText: string; // "{score} points ({correct}/{total})", "{category}", "{appName}" placeholders
  };
  leaderboard: {
    heading: string;
    subheading: string;
    empty: string;
  };
  footer: {
    verse: string;
    tagline: string;
  };
  common: {
    comingSoon: string;
    guest: string;
    signIn: string;
    level: string;
    xp: string;
    lives: string;
    appName: string;
  };
  difficultySection: {
    heading: string;
    subheading: string;
  };
  challenges: {
    heading: string;
    daily: { title: string; subtitle: string };
    weekly: { title: string; subtitle: string };
  };
  achievements: {
    heading: string;
    newBadge: string;
    newTag: string;
    list: Record<AchievementId, { title: string; description: string }>;
  };
  bible: {
    heading: string;
    subheading: string;
    dailyVerse: { title: string };
    memoryVerse: { title: string; subtitle: string; reveal: string; hideAgain: string };
    readingPlan: { title: string; subtitle: string };
    favorites: { title: string; subtitle: string };
    prayerJournal: { title: string; subtitle: string };
  };
  church: {
    heading: string;
    subheading: string;
    competition: { title: string; subtitle: string };
    youthChallenge: { title: string; subtitle: string };
    sundaySchool: { title: string; subtitle: string };
    teamVsTeam: { title: string; subtitle: string };
    dashboard: { title: string; subtitle: string };
  };
  profile: {
    title: string;
    guestNotice: string;
    signInNotice: string;
    statsHeading: string;
    quizzesCompleted: string;
    totalXp: string;
    badgesHeading: string;
    heroTagline: string;
    xpProgressHeading: string;
    totalGames: string;
    questionsAnswered: string;
    correctAnswers: string;
    longestStreak: string;
    currentStreak: string;
    totalCoins: string;
    dailyGoalHeading: string;
    dailyGoalQuestionsLabel: string;
    dailyGoalXpLabel: string;
    dailyGoalComplete: string;
    recentActivityHeading: string;
    recentActivityEmpty: string;
    favoriteCategoriesHeading: string;
    favoriteCategoriesEmpty: string;
    timesPlayed: string; // "{count}" placeholder
    actionsHeading: string;
    editProfile: string;
    settings: string;
    friends: string;
    statisticsAction: string;
  };
  sound: {
    on: string;
    off: string;
  };
  campaign: {
    journey: string;
    passInstruction: string;
    foundation: string;
    growingDisciple: string;
    scriptureMaster: string;
    completedAll: string;
    unlocked: string;
    needToUnlock: string;
    continueToLevel: string;
    tryLevelAgain: string;
    practiceAgain: string;
    quizLevel: string;
  };
  battle: {
    newMode: string;
    title: string;
    launcherDescription: string;
    play: string;
    sameQuestionTitle: string;
    setupDescription: string;
    players: string;
    player: string;
    addPlayer: string;
    removePlayer: string;
    category: string;
    battleLevel: string;
    scoringLabel: string;
    scoringText: string;
    back: string;
    start: string;
    champion: string;
    battlePoints: string;
    correctShort: string;
    wrongShort: string;
    fastest: string;
    exit: string;
    rematch: string;
    doublePoints: string;
    answerLocked: string;
    nextLoading: string;
    pointsShort: string;
  };
  multiplayerLobby: {
    eyebrow: string;
    heading: string;
    subheading: string;
    playerSetupHeading: string;
    playerNameLabel: string;
    playerNamePlaceholder: string;
    languageLabel: string;
    switchPlayerButton: string;
    switchPlayerHint: string;
    switchingPlayer: string;
    createRoomTitle: string;
    createRoomDescription: string;
    createRoomButton: string;
    creatingRoom: string;
    joinRoomTitle: string;
    joinRoomDescription: string;
    roomCodeLabel: string;
    roomCodePlaceholder: string;
    joinRoomButton: string;
    joiningRoom: string;
    quickMatchTitle: string;
    quickMatchDescription: string;
    maxPlayersLabel: string;
    categoryLabel: string;
    difficultyLabel: string;
    roomNameLabel: string;
    hostLabel: string;
    privacyLabel: string;
    privateRoomBadge: string;
    errorGeneric: string;
    errorEnterName: string;
    errorEnterCode: string;
    errorRoomNotFound: string;
    errorRoomStarted: string;
    errorRoomFull: string;
    errorUniqueCode: string;
    backToHome: string;
    lobbyEyebrow: string;
    lobbyHeading: string;
    roomCodeShareHint: string;
    copyCodeButton: string;
    copiedMessage: string;
    shareButton: string;
    playersHeading: string;
    hostBadge: string;
    readyButton: string;
    notReadyButton: string;
    waitingBadge: string;
    readyBadge: string;
    minPlayersHint: string;
    startButton: string;
    startingBattle: string;
    waitingForHost: string;
    cancelRoomButton: string;
    leaveRoomButton: string;
    leavingRoom: string;
    cancelingRoom: string;
    emptyStateHeading: string;
    emptyStateBody: string;
    countdownGo: string;
    loadingLobby: string;
    roomNotFoundMessage: string;
    joinPageHeading: string;
    joinPageSubheading: string;
  };
  battleShared: {
    connectedLabel: string;
    reconnectingLabel: string;
    disconnectedLabel: string;
    phaseWaiting: string;
    phaseCountdown: string;
    phaseQuestion: string;
    phaseReveal: string;
    phaseLeaderboard: string;
    phaseFinished: string;
    phaseChangedAnnouncement: string; // "{phase}" placeholder
    secondsShort: string;
    timeUpLabel: string;
  };
  multiplayerHost: {
    joinUrlLabel: string;
    qrHeading: string;
    qrHint: string;
    connectedPlayersLabel: string; // "{count}" placeholder
    levelLabel: string;
    questionCountLabel: string;
    startBattleButton: string;
    endRoomButton: string;
    endRoomConfirm: string;
    restartBattleButton: string;
    removePlayerButton: string;
    removePlayerConfirm: string; // "{name}" placeholder
    waitingPlayersHeading: string;
    noPlayersYet: string;
    audienceViewLabel: string;
    answeredCountLabel: string; // "{answered}" / "{total}" placeholders
    revealHeading: string;
    distributionHeading: string;
    fastestCorrectLabel: string;
    topPlayersHeading: string;
    nextQuestionCountdown: string; // "{seconds}" placeholder
    continueButton: string;
    finalWinnerHeading: string;
    finalTopThreeHeading: string;
    finalLeaderboardHeading: string;
    finalAccuracyLabel: string;
    finalFastestResponseLabel: string;
    finalXpLabel: string;
    finalRewardsLabel: string;
    newBattleButton: string;
    backToMultiplayerButton: string;
    notHostError: string;
    loadingHost: string;
    noOneAnsweredCorrectly: string;
  };
  multiplayerPlayer: {
    joinedAsLabel: string; // "{name}" placeholder
    connectedPlayersHeading: string;
    yourScoreLabel: string;
    yourStreakLabel: string;
    answerSubmittedMessage: string;
    waitingForOthersMessage: string;
    youAnsweredAria: string;
    correctMessage: string;
    incorrectMessage: string;
    correctAnswerWasLabel: string;
    pointsEarnedLabel: string;
    responseTimeLabel: string;
    currentRankHeading: string;
    currentRankLabel: string; // "{rank}" / "{total}" placeholders
    waitingForNextMessage: string;
    finalRankLabel: string;
    finalScoreLabel: string;
    finalAccuracyLabel: string;
    finalCorrectAnswersLabel: string;
    finalAvgResponseTimeLabel: string;
    playAgainButton: string;
    leaveButton: string;
    errorInvalidCode: string;
    errorRoomFinished: string;
    errorDuplicateName: string;
    errorAnswerFailed: string;
    errorExpiredRoom: string;
    reconnectingMessage: string;
    hostDisconnectedMessage: string;
  };
  globalLeaderboard: {
    navLabel: string;
    heading: string;
    subheading: string;
    filterGlobal: string;
    filterWeekly: string;
    filterMonthly: string;
    filterAllTime: string;
    filterFriends: string;
    filterChurch: string;
    metricTotalXp: string;
    metricBattleWins: string;
    metricAccuracy: string;
    metricCorrectAnswers: string;
    metricWinStreak: string;
    metricFastestResponse: string;
    podiumHeading: string;
    columnRank: string;
    columnPlayer: string;
    columnCountry: string;
    columnChurch: string;
    columnLevel: string;
    columnWins: string;
    columnStreak: string;
    youBadge: string;
    loading: string;
    emptyHeading: string;
    emptyBody: string;
    errorHeading: string;
    errorBody: string;
    retry: string;
    loadMore: string;
    showingCount: string; // "{shown}" / "{total}" placeholders
    yourGlobalRank: string;
    yourWeeklyRank: string;
    distanceToNextRank: string; // "{xp}" / "{rank}" placeholders
    alreadyTopRank: string;
    rankUp: string;
    rankDown: string;
    rankSame: string;
    notRankedYet: string;
    searchPlaceholder: string;
    clearSearch: string;
    noSearchResults: string;
    previewFavoriteCategory: string;
    previewBestStreak: string;
    previewClose: string;
    friendsEmptyHeading: string;
    friendsEmptyBody: string;
    churchEmptyHeading: string;
    churchEmptyBody: string;
    devModeBadge: string;
  };
}
