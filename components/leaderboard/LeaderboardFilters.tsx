"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LeaderboardMetric, LeaderboardWindow } from "@/lib/globalLeaderboard";

export type LeaderboardView = LeaderboardWindow | "friends" | "church";

export default function LeaderboardFilters({
  activeView,
  onViewChange,
  activeMetric,
  onMetricChange,
  onSearchChange,
  views,
  metrics,
  searchPlaceholder,
  clearSearchLabel,
}: {
  activeView: LeaderboardView;
  onViewChange: (view: LeaderboardView) => void;
  activeMetric: LeaderboardMetric;
  onMetricChange: (metric: LeaderboardMetric) => void;
  onSearchChange: (value: string) => void;
  views: Array<{ id: LeaderboardView; label: string }>;
  metrics: Array<{ id: LeaderboardMetric; label: string }>;
  searchPlaceholder: string;
  clearSearchLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onSearchChange(searchInput), 350);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handleClear() {
    setSearchInput("");
    onSearchChange("");
  }

  return (
    <div className="mx-auto max-w-5xl px-5">
      <div role="tablist" aria-label="Leaderboard view" className="flex flex-wrap justify-center gap-2">
        {views.map((view) => {
          const isActive = view.id === activeView;
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(view.id)}
              className={`relative rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                isActive
                  ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                  : "border-white/15 bg-white/[0.03] text-[#c6cbd6] hover:border-white/30"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="leaderboard-view-highlight"
                  transition={reduceMotion ? { duration: 0 } : undefined}
                  className="absolute inset-0 -z-10 rounded-full border border-gold-500/50 bg-gold-500/15"
                />
              )}
              {view.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="leaderboard-metric">
          {searchPlaceholder}
        </label>
        <select
          id="leaderboard-metric"
          value={activeMetric}
          onChange={(e) => onMetricChange(e.target.value as LeaderboardMetric)}
          className="w-full rounded-full border border-purple-400/30 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#f3efe2] outline-none transition-colors focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 sm:w-auto"
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id} className="bg-navy-900">
              {m.label}
            </option>
          ))}
        </select>

        <div className="relative w-full sm:max-w-xs">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-4 pr-9 text-sm text-[#f3efe2] outline-none transition-colors placeholder:text-[#7c8394] focus:border-gold-500/60 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={clearSearchLabel}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d94a3] outline-none hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
