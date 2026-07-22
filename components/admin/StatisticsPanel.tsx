"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface StatsResponse {
  totalCanonicalQuestions: number;
  languageBreakdown: {
    byLanguage: Array<{
      language: string;
      total: number;
      byLevel: Array<{ level: number; total: number; byDifficulty: { Easy: number; Medium: number; Hard: number } }>;
    }>;
  };
  categoryBreakdown: Array<{ category: string; count: number }>;
  translationCompletion: Array<{ language: string; percent: number }>;
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", am: "Amharic" };

/** Part 9's detailed breakdown — by language, by level, by difficulty, by
 * category, translation completion %. The Dashboard tab shows a summary
 * of the same live data; this tab is the full table. */
export default function StatisticsPanel({ secret }: { secret: string }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch<StatsResponse>(secret, "/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load statistics."))
      .finally(() => setLoading(false));
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-black">📈 Statistics</h1>
        <div className="mt-6">
          <ErrorBanner message={`Couldn't load statistics: ${error}`} onRetry={load} />
        </div>
      </div>
    );
  }
  if (!stats) return null;

  const maxCategoryCount = Math.max(1, ...stats.categoryBreakdown.map((c) => c.count));

  return (
    <div>
      <h1 className="text-3xl font-black">📈 Statistics</h1>

      {stats.languageBreakdown.byLanguage.map((lang) => (
        <section key={lang.language} className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold">
            {LANGUAGE_NAMES[lang.language] ?? lang.language} — {lang.total} questions (
            {stats.translationCompletion.find((t) => t.language === lang.language)?.percent ?? 0}% of the bank)
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="p-2">Level</th>
                <th className="p-2">Easy</th>
                <th className="p-2">Medium</th>
                <th className="p-2">Hard</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {lang.byLevel.map((l) => (
                <tr key={l.level} className="border-t border-white/5">
                  <td className="p-2 font-semibold">Level {l.level}</td>
                  <td className="p-2">{l.byDifficulty.Easy}</td>
                  <td className="p-2">{l.byDifficulty.Medium}</td>
                  <td className="p-2">{l.byDifficulty.Hard}</td>
                  <td className="p-2 font-bold">{l.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-bold">By category</h2>
        <div className="mt-3 space-y-2">
          {stats.categoryBreakdown.map((c) => (
            <div key={c.category} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 text-slate-400">{c.category}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-amber-400" style={{ width: `${(c.count / maxCategoryCount) * 100}%` }} />
              </div>
              <span className="w-10 text-right font-bold">{c.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
