// Global (Supabase-backed) leaderboard data layer — Sprint 6.
//
// This is a NEW, separate module from lib/leaderboard.ts, which remains
// untouched and continues to power the existing local/device leaderboard
// (Leaderboard.tsx, LeaderboardPreview.tsx, ResultCard's "Save to
// Leaderboard"). This module only READS aggregated stats via the
// public.get_leaderboard(...) RPC (see supabase/migrations/
// 20260718_global_leaderboard.sql) — it never writes XP, coins, or any
// other stat. All numbers it returns are computed live from real
// profiles/rooms/room_players/answers rows.
import { createClient } from "@/lib/supabase/client";
import type { CategoryId } from "@/lib/categories";

export type LeaderboardMetric =
  | "total_xp"
  | "total_battle_wins"
  | "accuracy_percent"
  | "total_correct_answers"
  | "current_win_streak"
  | "average_response_ms";

export type LeaderboardWindow = "all_time" | "weekly" | "monthly";

export interface LeaderboardRow {
  playerId: string;
  displayName: string;
  avatar: string | null;
  churchName: string | null;
  countryCode: string | null;
  playerLevel: number;
  campaignLevel: number;
  totalXp: number;
  totalCoins: number;
  totalBattleWins: number;
  totalCorrectAnswers: number;
  totalAnswers: number;
  accuracyPercent: number;
  currentWinStreak: number;
  bestWinStreak: number;
  averageResponseMs: number;
  windowPoints: number;
  favoriteCategoryId: CategoryId | null;
  rank: number;
  totalCount: number;
}

interface RawRow {
  player_id: string;
  display_name: string;
  avatar: string | null;
  church_name: string | null;
  country_code: string | null;
  player_level: number;
  campaign_level: number;
  total_xp: number;
  total_coins: number;
  total_battle_wins: number;
  total_correct_answers: number;
  total_answers: number;
  accuracy_percent: number;
  current_win_streak: number;
  best_win_streak: number;
  average_response_ms: number;
  window_points: number;
  favorite_category_id: string | null;
  rank: number;
  total_count: number;
}

function mapRow(row: RawRow): LeaderboardRow {
  return {
    playerId: row.player_id,
    displayName: row.display_name,
    avatar: row.avatar,
    churchName: row.church_name,
    countryCode: row.country_code,
    playerLevel: row.player_level,
    campaignLevel: row.campaign_level,
    totalXp: row.total_xp,
    totalCoins: row.total_coins,
    totalBattleWins: Number(row.total_battle_wins),
    totalCorrectAnswers: Number(row.total_correct_answers),
    totalAnswers: Number(row.total_answers),
    accuracyPercent: Number(row.accuracy_percent),
    currentWinStreak: row.current_win_streak,
    bestWinStreak: row.best_win_streak,
    averageResponseMs: Number(row.average_response_ms),
    windowPoints: Number(row.window_points),
    favoriteCategoryId: (row.favorite_category_id as CategoryId | null) ?? null,
    rank: Number(row.rank),
    totalCount: Number(row.total_count),
  };
}

export interface FetchLeaderboardParams {
  metric: LeaderboardMetric;
  window: LeaderboardWindow;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FetchLeaderboardResult {
  rows: LeaderboardRow[];
  totalCount: number;
  /** true only when Supabase is unreachable/unconfigured and the clearly
   * separated development fallback below was used instead. Never true in
   * a real deployment with Supabase configured. */
  usedDevFallback: boolean;
}

async function callGetLeaderboard(params: {
  p_metric: string;
  p_window: string;
  p_search: string | null;
  p_limit: number;
  p_offset: number;
  p_player_id: string | null;
}): Promise<RawRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_leaderboard", params);
  if (error) throw error;
  return (data ?? []) as RawRow[];
}

export async function fetchLeaderboard({
  metric,
  window,
  search,
  limit = 25,
  offset = 0,
}: FetchLeaderboardParams): Promise<FetchLeaderboardResult> {
  try {
    const rows = await callGetLeaderboard({
      p_metric: metric,
      p_window: window,
      p_search: search?.trim() || null,
      p_limit: limit,
      p_offset: offset,
      p_player_id: null,
    });
    const mapped = rows.map(mapRow);
    return { rows: mapped, totalCount: mapped[0]?.totalCount ?? 0, usedDevFallback: false };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[dev-only] Falling back to mock leaderboard data:", error);
      return devMockLeaderboard({ metric, window, search, limit, offset });
    }
    throw error;
  }
}

export async function fetchMyRank({
  metric,
  window,
  playerId,
}: {
  metric: LeaderboardMetric;
  window: LeaderboardWindow;
  playerId: string;
}): Promise<LeaderboardRow | null> {
  try {
    const rows = await callGetLeaderboard({
      p_metric: metric,
      p_window: window,
      p_search: null,
      p_limit: 1,
      p_offset: 0,
      p_player_id: playerId,
    });
    return rows[0] ? mapRow(rows[0]) : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[dev-only] Falling back to mock rank data:", error);
      const { rows } = devMockLeaderboard({ metric, window, limit: 200, offset: 0 });
      return rows.find((r) => r.playerId === playerId) ?? rows[0] ?? null;
    }
    throw error;
  }
}

/** Reads any existing Supabase session WITHOUT creating one — this page
 * only reads/displays stats, it must never sign a visitor in or write a
 * profile row just from being viewed. */
export async function getCurrentPlayerId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** The raw numeric value for whichever metric is currently selected — used
 * to render the "big number" on a podium card / table row / preview. */
export function metricValue(row: LeaderboardRow, metric: LeaderboardMetric, windowScope: LeaderboardWindow): number {
  switch (metric) {
    case "total_xp":
      return windowScope === "all_time" ? row.totalXp : row.windowPoints;
    case "total_battle_wins":
      return row.totalBattleWins;
    case "accuracy_percent":
      return row.accuracyPercent;
    case "total_correct_answers":
      return row.totalCorrectAnswers;
    case "current_win_streak":
      return row.currentWinStreak;
    case "average_response_ms":
      return row.averageResponseMs;
    default:
      return row.totalXp;
  }
}

/** Formats a metric's raw value for display (e.g. "82.4%", "3.2s"). */
export function formatMetricValue(value: number, metric: LeaderboardMetric): string {
  switch (metric) {
    case "accuracy_percent":
      return `${value}%`;
    case "average_response_ms":
      return value > 0 ? `${(value / 1000).toFixed(1)}s` : "—";
    default:
      return Math.round(value).toLocaleString();
  }
}

// "Rank change from previous period" has no historical ranking-snapshot
// table to compare against (and adding one is out of scope for a
// read-only leaderboard page), so it's honestly defined as "change since
// you last viewed this leaderboard" — a small, client-only cache, not a
// new backend stat system.
const LAST_RANK_KEY = "menorah-bible-quiz-last-global-rank";

export function readCachedGlobalRank(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_RANK_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function writeCachedGlobalRank(rank: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_RANK_KEY, String(rank));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

export function countryCodeToFlagEmoji(code: string | null | undefined): string | null {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  const codePoints = [...upper].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

// ---------------------------------------------------------------------------
// DEVELOPMENT-ONLY MOCK FALLBACK
// ---------------------------------------------------------------------------
// Used ONLY when NODE_ENV !== "production" and the real Supabase RPC call
// failed (e.g. Supabase isn't configured in this environment, or the
// migration hasn't been run yet locally). Never used in production — see
// the `usedDevFallback` flag threaded through every call above, which the
// UI surfaces as a visible "Development Mode" badge so this can never be
// mistaken for real player data.
const DEV_MOCK_PLAYERS: Array<Omit<LeaderboardRow, "rank" | "totalCount">> = [
  {
    playerId: "dev-1",
    displayName: "Selam T.",
    avatar: null,
    churchName: "Grace Fellowship",
    countryCode: "ET",
    playerLevel: 12,
    campaignLevel: 9,
    totalXp: 4820,
    totalCoins: 640,
    totalBattleWins: 14,
    totalCorrectAnswers: 312,
    totalAnswers: 350,
    accuracyPercent: 89.1,
    currentWinStreak: 4,
    bestWinStreak: 9,
    averageResponseMs: 3200,
    windowPoints: 640,
    favoriteCategoryId: "old-testament",
  },
  {
    playerId: "dev-2",
    displayName: "Daniel K.",
    avatar: null,
    churchName: "Living Word Church",
    countryCode: "US",
    playerLevel: 10,
    campaignLevel: 8,
    totalXp: 4110,
    totalCoins: 505,
    totalBattleWins: 11,
    totalCorrectAnswers: 275,
    totalAnswers: 320,
    accuracyPercent: 85.9,
    currentWinStreak: 0,
    bestWinStreak: 7,
    averageResponseMs: 3900,
    windowPoints: 420,
    favoriteCategoryId: "new-testament",
  },
  {
    playerId: "dev-3",
    displayName: "Miriam A.",
    avatar: null,
    churchName: null,
    countryCode: "KE",
    playerLevel: 9,
    campaignLevel: 7,
    totalXp: 3675,
    totalCoins: 410,
    totalBattleWins: 8,
    totalCorrectAnswers: 240,
    totalAnswers: 300,
    accuracyPercent: 80.0,
    currentWinStreak: 2,
    bestWinStreak: 5,
    averageResponseMs: 4400,
    windowPoints: 310,
    favoriteCategoryId: "psalms-proverbs",
  },
  {
    playerId: "dev-4",
    displayName: "Yosef B.",
    avatar: null,
    churchName: "St. Mary Youth",
    countryCode: "ET",
    playerLevel: 7,
    campaignLevel: 6,
    totalXp: 2450,
    totalCoins: 300,
    totalBattleWins: 5,
    totalCorrectAnswers: 190,
    totalAnswers: 260,
    accuracyPercent: 73.1,
    currentWinStreak: 1,
    bestWinStreak: 3,
    averageResponseMs: 5100,
    windowPoints: 180,
    favoriteCategoryId: "life-of-jesus",
  },
  {
    playerId: "dev-5",
    displayName: "Grace N.",
    avatar: null,
    churchName: null,
    countryCode: null,
    playerLevel: 5,
    campaignLevel: 4,
    totalXp: 1580,
    totalCoins: 190,
    totalBattleWins: 2,
    totalCorrectAnswers: 120,
    totalAnswers: 190,
    accuracyPercent: 63.2,
    currentWinStreak: 0,
    bestWinStreak: 2,
    averageResponseMs: 6200,
    windowPoints: 90,
    favoriteCategoryId: "faith-prayer",
  },
];

function sortKeyFor(row: Omit<LeaderboardRow, "rank" | "totalCount">, metric: LeaderboardMetric, windowScope: LeaderboardWindow): number {
  switch (metric) {
    case "total_xp":
      return windowScope === "all_time" ? row.totalXp : row.windowPoints;
    case "total_battle_wins":
      return row.totalBattleWins;
    case "accuracy_percent":
      return row.accuracyPercent;
    case "total_correct_answers":
      return row.totalCorrectAnswers;
    case "current_win_streak":
      return row.currentWinStreak;
    case "average_response_ms":
      return row.averageResponseMs > 0 ? -row.averageResponseMs : -999999999;
    default:
      return row.totalXp;
  }
}

function devMockLeaderboard({
  metric,
  window,
  search,
  limit = 25,
  offset = 0,
}: FetchLeaderboardParams): FetchLeaderboardResult {
  const filtered = DEV_MOCK_PLAYERS.filter((p) => {
    if (!search) return true;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.displayName.toLowerCase().includes(q) || (p.churchName ?? "").toLowerCase().includes(q);
  });
  const sorted = [...filtered].sort((a, b) => sortKeyFor(b, metric, window) - sortKeyFor(a, metric, window));
  const withRank: LeaderboardRow[] = sorted.map((row, i) => ({ ...row, rank: i + 1, totalCount: sorted.length }));
  return { rows: withRank.slice(offset, offset + limit), totalCount: sorted.length, usedDevFallback: true };
}
