import { addDailyReward } from "./progress";

const STORAGE_KEY = "menorah-bible-quiz-daily-reward";

export interface DailyRewardState {
  lastClaimDate: string | null;
  streak: number;
}

export const DAILY_REWARDS = [
  { day: 1, coins: 20, xp: 0, label: "20 coins" },
  { day: 2, coins: 0, xp: 50, label: "50 XP" },
  { day: 3, coins: 30, xp: 0, label: "30 coins" },
  { day: 4, coins: 10, xp: 25, label: "10 coins + 25 XP" },
  { day: 5, coins: 40, xp: 0, label: "40 coins" },
  { day: 6, coins: 0, xp: 75, label: "75 XP" },
  { day: 7, coins: 100, xp: 100, label: "Special reward" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadDailyReward(): DailyRewardState {
  if (typeof window === "undefined") return { lastClaimDate: null, streak: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastClaimDate: null, streak: 0 };
    const parsed = JSON.parse(raw) as Partial<DailyRewardState>;
    return {
      lastClaimDate: typeof parsed.lastClaimDate === "string" ? parsed.lastClaimDate : null,
      streak: typeof parsed.streak === "number" ? Math.max(0, parsed.streak) : 0,
    };
  } catch {
    return { lastClaimDate: null, streak: 0 };
  }
}

export function canClaimDailyReward(state = loadDailyReward()) {
  return state.lastClaimDate !== todayKey();
}

export function claimDailyReward() {
  const state = loadDailyReward();
  if (!canClaimDailyReward(state)) return null;
  const nextStreak = state.lastClaimDate === yesterdayKey() ? state.streak + 1 : 1;
  const reward = DAILY_REWARDS[(nextStreak - 1) % DAILY_REWARDS.length];
  const nextState: DailyRewardState = { lastClaimDate: todayKey(), streak: nextStreak };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }
  const progressUpdate = addDailyReward(reward.xp, reward.coins);
  return { reward, state: nextState, progressUpdate };
}
