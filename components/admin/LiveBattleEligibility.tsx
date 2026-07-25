"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { LangCode } from "@/lib/i18n/locales";

interface LevelRow {
  level: number;
  difficulty: "Easy" | "Medium" | "Hard";
  publishedQuestionCount: number;
  gameplayEligibleCount: number;
}

interface LanguageEligibility {
  code: LangCode;
  nativeName: string;
  englishName: string;
  levels: LevelRow[];
  translationStatus: {
    aiDraft: number;
    needsReview: number;
    approved: number;
    published: number;
    rejected: number;
    archived: number;
  };
}

interface Response {
  languages: LanguageEligibility[];
}

// Matches the default `question_count` a Live Battle room asks for
// (createBattleRoom's default, and rooms.question_count's own default) —
// below this, seedRoomQuestions() would either fall back to a smaller
// count than requested or fail outright for that language/level.
const ROOM_QUESTION_COUNT_DEFAULT = 10;

/**
 * Mission 14 Part C — "is this language/level actually playable in Live
 * Battle right now," distinct from the editorial review pipeline's own
 * status counts. Every number here comes from
 * computeLiveBattleEligibility(), which runs the SAME published-question +
 * published-translation bar seedRoomQuestions() itself requires — so
 * "Eligible" here is not an approximation, it's the real figure a host
 * would hit creating a room right now (before Mission 14's per-room
 * category filter, which narrows further on a per-room basis).
 */
export default function LiveBattleEligibility({ secret }: { secret: string }) {
  const [data, setData] = useState<LanguageEligibility[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string>("en");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminFetch<Response>(secret, "/api/admin/live-battle-eligibility")
      .then((res) => {
        if (cancelled) return;
        setData(res.languages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load eligibility.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [secret]);

  if (loading) return <SkeletonTable rows={6} />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const selected = data.find((l) => l.code === selectedLang) ?? data[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">🎮 Live Battle Eligibility</h2>
        <p className="mt-1 text-sm text-slate-400">
          Exact gameplay-eligible question counts per language and level — the same published-question + published-translation bar
          seedRoomQuestions() itself requires, not an approximation. Use this to confirm newly published Admin content actually became
          playable.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2 text-right">Draft</th>
              <th className="px-3 py-2 text-right">Needs Review</th>
              <th className="px-3 py-2 text-right">Approved</th>
              <th className="px-3 py-2 text-right">Published</th>
              <th className="px-3 py-2 text-right">Rejected</th>
              <th className="px-3 py-2 text-right">Archived</th>
              <th className="px-3 py-2 text-right">Levels ≥ {ROOM_QUESTION_COUNT_DEFAULT} eligible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((lang) => {
              const levelsReady = lang.levels.filter((l) => l.gameplayEligibleCount >= ROOM_QUESTION_COUNT_DEFAULT).length;
              return (
                <tr
                  key={lang.code}
                  className={`cursor-pointer hover:bg-slate-800/60 ${lang.code === selected.code ? "bg-slate-800/80" : ""}`}
                  onClick={() => setSelectedLang(lang.code)}
                >
                  <td className="px-3 py-2 font-medium text-slate-200">
                    {lang.nativeName} <span className="text-slate-500">({lang.englishName})</span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{lang.translationStatus.aiDraft}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{lang.translationStatus.needsReview}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{lang.translationStatus.approved}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-400">{lang.translationStatus.published}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{lang.translationStatus.rejected}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{lang.translationStatus.archived}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        levelsReady > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {levelsReady}/10
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-200">
          Per-level breakdown — {selected.nativeName} ({selected.englishName})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Difficulty</th>
                <th className="px-3 py-2 text-right">Published Questions (any language)</th>
                <th className="px-3 py-2 text-right">Gameplay Eligible ({selected.englishName})</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {selected.levels.map((row) => {
                const ready = row.gameplayEligibleCount >= ROOM_QUESTION_COUNT_DEFAULT;
                return (
                  <tr key={row.level}>
                    <td className="px-3 py-2 font-medium text-slate-200">Level {row.level}</td>
                    <td className="px-3 py-2 text-slate-400">{row.difficulty}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{row.publishedQuestionCount}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-200">{row.gameplayEligibleCount}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          ready ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {ready ? "Ready" : `Needs ${ROOM_QUESTION_COUNT_DEFAULT - row.gameplayEligibleCount} more`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
