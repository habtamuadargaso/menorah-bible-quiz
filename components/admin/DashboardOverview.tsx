"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/apiClient";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface StatsResponse {
  totalCanonicalQuestions: number;
  languageBreakdown: {
    byLanguage: Array<{ language: string; total: number }>;
  };
  translationCompletion: Array<{ language: string; translatedCount: number; totalQuestions: number; percent: number }>;
  reviewCounts: Record<"draft" | "needs-review" | "approved" | "published" | "rejected" | "archived", number>;
  validation: { errorCount: number; warningCount: number };
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "good" | "bad" | "warn" }) {
  const toneClass =
    tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

export default function DashboardOverview({ secret }: { secret: string }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch<StatsResponse>(secret, "/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats."))
      .finally(() => setLoading(false));
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-black">📊 Dashboard</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-black">📊 Dashboard</h1>
        <div className="mt-6">
          <ErrorBanner message={`Couldn't load dashboard statistics: ${error}`} onRetry={load} />
        </div>
      </div>
    );
  }
  if (!stats) return null;

  const en = stats.languageBreakdown.byLanguage.find((l) => l.language === "en");
  const am = stats.languageBreakdown.byLanguage.find((l) => l.language === "am");
  const enCompletion = stats.translationCompletion.find((t) => t.language === "en");
  const amCompletion = stats.translationCompletion.find((t) => t.language === "am");

  return (
    <div>
      <h1 className="text-3xl font-black">📊 Dashboard</h1>
      <p className="mt-2 text-slate-400">Live from the canonical question store — nothing here is hardcoded.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total canonical questions" value={stats.totalCanonicalQuestions} />
        <StatCard label="English translations" value={en?.total ?? 0} />
        <StatCard label="Amharic translations" value={am?.total ?? 0} />
        <StatCard label="Amharic completion %" value={`${amCompletion?.percent ?? 0}%`} tone={amCompletion && amCompletion.percent < 50 ? "warn" : "good"} />
      </div>

      <h2 className="mt-10 text-xl font-bold">Review workflow</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Draft" value={stats.reviewCounts.draft} />
        <StatCard label="Needs Review" value={stats.reviewCounts["needs-review"]} tone="warn" />
        <StatCard label="Approved" value={stats.reviewCounts.approved} tone="good" />
        <StatCard label="Published" value={stats.reviewCounts.published} tone="good" />
        <StatCard label="Rejected" value={stats.reviewCounts.rejected} tone="bad" />
        <StatCard label="Archived" value={stats.reviewCounts.archived} />
      </div>

      <h2 className="mt-10 text-xl font-bold">Validation</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Validation errors" value={stats.validation.errorCount} tone={stats.validation.errorCount > 0 ? "bad" : "good"} />
        <StatCard label="Validation warnings" value={stats.validation.warningCount} tone={stats.validation.warningCount > 0 ? "warn" : "good"} />
      </div>

      <p className="mt-6 text-xs text-slate-500">
        English translation completion: {enCompletion?.percent ?? 0}% ({enCompletion?.translatedCount ?? 0}/{enCompletion?.totalQuestions ?? 0})
      </p>
    </div>
  );
}
