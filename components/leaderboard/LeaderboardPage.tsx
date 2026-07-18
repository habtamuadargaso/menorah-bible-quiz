"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  fetchLeaderboard,
  fetchMyRank,
  getCurrentPlayerId,
  readCachedGlobalRank,
  writeCachedGlobalRank,
  type LeaderboardMetric,
  type LeaderboardRow,
  type LeaderboardWindow,
} from "@/lib/globalLeaderboard";
import LeaderboardHeader from "./LeaderboardHeader";
import LeaderboardFilters, { type LeaderboardView } from "./LeaderboardFilters";
import LeaderboardPodium from "./LeaderboardPodium";
import LeaderboardTable from "./LeaderboardTable";
import CurrentPlayerRankCard from "./CurrentPlayerRankCard";
import PlayerProfilePreview from "./PlayerProfilePreview";
import LeaderboardSkeleton from "./LeaderboardSkeleton";
import LeaderboardEmptyState from "./LeaderboardEmptyState";

const PAGE_SIZE = 25;

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const lb = t.globalLeaderboard;

  const [view, setView] = useState<LeaderboardView>("all_time");
  const [metric, setMetric] = useState<LeaderboardMetric>("total_xp");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [usedDevFallback, setUsedDevFallback] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<LeaderboardRow | null>(null);

  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [weeklyRank, setWeeklyRank] = useState<number | null>(null);
  const [myXp, setMyXp] = useState(0);
  const [myLevel, setMyLevel] = useState(1);
  const [xpToNextRank, setXpToNextRank] = useState<number | null>(null);
  const [rankChange, setRankChange] = useState<"up" | "down" | "same" | null>(null);

  const isDataView = view === "all_time" || view === "weekly" || view === "monthly";
  const windowParam: LeaderboardWindow = view === "all_time" ? "all_time" : view === "weekly" ? "weekly" : "monthly";

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!isDataView) return;
      if (append) setIsLoadingMore(true);
      else setStatus("loading");
      try {
        const result = await fetchLeaderboard({ metric, window: windowParam, search, limit: PAGE_SIZE, offset });
        setUsedDevFallback(result.usedDevFallback);
        setRows((prev) => (append ? [...prev, ...result.rows] : result.rows));
        setTotalCount(result.totalCount);
        setStatus("ready");
      } catch (error) {
        console.error("Leaderboard load error:", error);
        setStatus("error");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [metric, windowParam, search, isDataView]
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  useEffect(() => {
    void getCurrentPlayerId().then(setCurrentPlayerId);
  }, []);

  // Fixed secondary summary (independent of the table's active filters):
  // real global (all-time) rank + real weekly rank, both by total XP, plus
  // the real gap to the player one rank above.
  const loadMySummary = useCallback(async () => {
    if (!currentPlayerId) return;
    try {
      const [globalRow, weeklyRow] = await Promise.all([
        fetchMyRank({ metric: "total_xp", window: "all_time", playerId: currentPlayerId }),
        fetchMyRank({ metric: "total_xp", window: "weekly", playerId: currentPlayerId }),
      ]);
      if (!globalRow) {
        setGlobalRank(null);
        return;
      }
      setGlobalRank(globalRow.rank);
      setMyXp(globalRow.totalXp);
      setMyLevel(globalRow.playerLevel);
      setWeeklyRank(weeklyRow?.rank ?? null);

      const previous = readCachedGlobalRank();
      setRankChange(previous === null ? null : previous > globalRow.rank ? "up" : previous < globalRow.rank ? "down" : "same");
      writeCachedGlobalRank(globalRow.rank);

      if (globalRow.rank > 1) {
        const neighbor = await fetchLeaderboard({ metric: "total_xp", window: "all_time", limit: 1, offset: globalRow.rank - 2 });
        const neighborXp = neighbor.rows[0]?.totalXp ?? null;
        setXpToNextRank(neighborXp !== null ? Math.max(1, neighborXp - globalRow.totalXp + 1) : null);
      } else {
        setXpToNextRank(null);
      }
    } catch (error) {
      console.error("Player rank summary error:", error);
    }
  }, [currentPlayerId]);

  useEffect(() => {
    void loadMySummary();
  }, [loadMySummary]);

  // Realtime: efficient, debounced refresh — only the two write paths that
  // actually change computed leaderboard stats (new answers, and score/XP
  // updates on room_players / profiles). No unrelated tables subscribed.
  const refreshTimerRef = useRef<number | null>(null);
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return; // Supabase not configured (dev sandbox) — skip realtime, polling/dev-fallback already covers data.
    }
    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void loadPage(0, false);
        void loadMySummary();
      }, 1500);
    };
    const channel = supabase
      .channel("global-leaderboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers" }, scheduleRefresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_players" }, scheduleRefresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, scheduleRefresh)
      .subscribe();
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [loadPage, loadMySummary]);

  const previewCategoryTitle = useMemo(() => {
    if (!previewRow?.favoriteCategoryId) return null;
    return t.categories[previewRow.favoriteCategoryId]?.title ?? null;
  }, [previewRow, t]);

  const views = useMemo(
    () => [
      { id: "all_time" as LeaderboardView, label: lb.filterGlobal },
      { id: "weekly" as LeaderboardView, label: lb.filterWeekly },
      { id: "monthly" as LeaderboardView, label: lb.filterMonthly },
      { id: "friends" as LeaderboardView, label: lb.filterFriends },
      { id: "church" as LeaderboardView, label: lb.filterChurch },
    ],
    [lb]
  );

  const metrics = useMemo(
    () => [
      { id: "total_xp" as LeaderboardMetric, label: lb.metricTotalXp },
      { id: "total_battle_wins" as LeaderboardMetric, label: lb.metricBattleWins },
      { id: "accuracy_percent" as LeaderboardMetric, label: lb.metricAccuracy },
      { id: "total_correct_answers" as LeaderboardMetric, label: lb.metricCorrectAnswers },
      { id: "current_win_streak" as LeaderboardMetric, label: lb.metricWinStreak },
      { id: "average_response_ms" as LeaderboardMetric, label: lb.metricFastestResponse },
    ],
    [lb]
  );

  const tableLabels = {
    columnRank: lb.columnRank,
    columnPlayer: lb.columnPlayer,
    columnCountry: lb.columnCountry,
    columnChurch: lb.columnChurch,
    columnLevel: lb.columnLevel,
    xp: t.common.xp,
    columnWins: lb.columnWins,
    accuracy: t.result.accuracy,
    columnStreak: lb.columnStreak,
    youBadge: lb.youBadge,
    loadMore: lb.loadMore,
    showingCount: lb.showingCount,
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-full overflow-x-hidden pb-28">
      <LeaderboardHeader heading={lb.heading} subheading={lb.subheading} devModeBadge={lb.devModeBadge} showDevBadge={usedDevFallback} />

      <div className="mb-8">
        <LeaderboardFilters
          activeView={view}
          onViewChange={(v) => setView(v)}
          activeMetric={metric}
          onMetricChange={setMetric}
          onSearchChange={setSearch}
          views={views}
          metrics={metrics}
          searchPlaceholder={lb.searchPlaceholder}
          clearSearchLabel={lb.clearSearch}
        />
      </div>

      {!isDataView ? (
        <div className="px-5">
          <LeaderboardEmptyState
            icon={view === "friends" ? "👥" : "⛪"}
            heading={view === "friends" ? lb.friendsEmptyHeading : lb.churchEmptyHeading}
            body={view === "friends" ? lb.friendsEmptyBody : lb.churchEmptyBody}
          />
        </div>
      ) : status === "loading" ? (
        <LeaderboardSkeleton />
      ) : status === "error" ? (
        <div className="px-5">
          <LeaderboardEmptyState icon="⚠️" heading={lb.errorHeading} body={lb.errorBody} actionLabel={lb.retry} onAction={() => void loadPage(0, false)} />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5">
          <LeaderboardEmptyState
            icon="🔍"
            heading={search ? lb.noSearchResults : lb.emptyHeading}
            body={lb.emptyBody}
          />
        </div>
      ) : (
        <>
          {!search && (
            <div className="mb-10">
              <LeaderboardPodium entries={rows.slice(0, 3)} metric={metric} windowScope={windowParam} heading={lb.podiumHeading} onSelectPlayer={setPreviewRow} />
            </div>
          )}
          <LeaderboardTable
            rows={rows}
            metric={metric}
            windowScope={windowParam}
            currentPlayerId={currentPlayerId}
            totalCount={totalCount}
            onLoadMore={() => void loadPage(rows.length, true)}
            isLoadingMore={isLoadingMore}
            onSelectPlayer={setPreviewRow}
            labels={tableLabels}
          />
        </>
      )}

      <div className="mt-8 px-5">
        <CurrentPlayerRankCard
          globalRank={globalRank}
          weeklyRank={weeklyRank}
          totalXp={myXp}
          playerLevel={myLevel}
          xpToNextRank={xpToNextRank}
          nextRankNumber={globalRank ? globalRank - 1 : null}
          rankChange={rankChange}
          labels={{
            yourGlobalRank: lb.yourGlobalRank,
            yourWeeklyRank: lb.yourWeeklyRank,
            level: t.common.level,
            xp: t.common.xp,
            distanceToNextRank: lb.distanceToNextRank,
            alreadyTopRank: lb.alreadyTopRank,
            rankUp: lb.rankUp,
            rankDown: lb.rankDown,
            rankSame: lb.rankSame,
            notRankedYet: lb.notRankedYet,
          }}
        />
      </div>

      <PlayerProfilePreview
        row={previewRow}
        categoryTitle={previewCategoryTitle}
        onClose={() => setPreviewRow(null)}
        labels={{
          level: t.common.level,
          xp: t.common.xp,
          columnWins: lb.columnWins,
          accuracy: t.result.accuracy,
          previewBestStreak: lb.previewBestStreak,
          previewFavoriteCategory: lb.previewFavoriteCategory,
          columnChurch: lb.columnChurch,
          previewClose: lb.previewClose,
        }}
      />
    </div>
  );
}
